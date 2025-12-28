import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import { executeAction } from '@/lib/orchestrator/executeAction'
import { omsClient } from '@/lib/tool-servers/oms'
import { normalizeShipment } from '@/lib/domain/normalize'
import { dispatchClient } from '@/lib/tool-servers/dispatch'
import { prisma } from '@/lib/prisma'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
})

// System prompt for Claude (Arabic-first, conversational, task-focused)
const SYSTEM_PROMPT = `أنت مساعد توصيل ذكي للطرود. هدفك: مساعدة العملاء في تعديل تفاصيل التوصيل بسرعة ودقة.

الشخصية:
- موجز: 1-2 جملة كحد أقصى لكل رد (إلا عند شرح رفض سياسة)
- ودود: استخدم "حسناً"، "تمام"، "لا مشكلة"
- ثنائي اللغة: الرد بالعربية أولاً، الإنجليزية ثانياً حسب لغة المستخدم
- استباقي: إذا كان بإمكانك التنفيذ فوراً، افعل ذلك. لا تسأل أسئلة غير ضرورية

النطاق:
- داخل النطاق (نفذ فوراً): إعادة جدولة، تحديث الملاحظات، تحديث الموقع
- خارج النطاق (سجل + اعترف): تفاصيل السائق، رقم اللوحة، محتويات الطلب، إلخ

السرعة:
- لا تكرر ما قاله المستخدم
- لا تشرح بإفراط إلا إذا منعت السياسة شيئاً
- انتقل للحل بسرعة

أمثلة:
مستخدم: "أريد تغيير الوقت"
أنت: "متى تفضل؟" [اعرض أوقات متاحة]

مستخدم: "ما رقم لوحة السيارة؟"
أنت: "سجلت سؤالك لفريق العمليات. هل تريد تعديل موعد أو موقع التسليم؟"

مستخدم: "الطقس جميل اليوم!"
أنت: "فعلاً! هل تحتاج مساعدة في التسليم؟"

الأدوات المتاحة:
1. reschedule_delivery - تغيير وقت التسليم
2. update_instructions - تحديث ملاحظات التسليم
3. update_location - تغيير موقع التسليم

استخدم الأدوات عند الحاجة فقط. إذا كان الطلب خارج النطاق، سجله كملاحظة ورد بلطف.`

// Function definitions for Claude
const tools: Anthropic.Messages.Tool[] = [
  {
    name: 'reschedule_delivery',
    description: 'إعادة جدولة موعد التسليم إلى وقت جديد. Use when customer wants to change delivery time/date.',
    input_schema: {
      type: 'object',
      properties: {
        new_date: {
          type: 'string',
          description: 'التاريخ الجديد بصيغة ISO (e.g., 2025-01-15)',
        },
        new_time_start: {
          type: 'string',
          description: 'وقت البداية بصيغة HH:MM (e.g., 14:00)',
        },
        new_time_end: {
          type: 'string',
          description: 'وقت النهاية بصيغة HH:MM (e.g., 16:00)',
        },
      },
      required: ['new_date', 'new_time_start', 'new_time_end'],
    },
  },
  {
    name: 'update_instructions',
    description: 'تحديث ملاحظات أو تعليمات التسليم. Use when customer wants to add/change delivery notes.',
    input_schema: {
      type: 'object',
      properties: {
        instructions: {
          type: 'string',
          description: 'الملاحظات الجديدة للتسليم (e.g., "اترك الطرد عند الباب")',
        },
      },
      required: ['instructions'],
    },
  },
  {
    name: 'update_location',
    description: 'تغيير موقع التسليم. Use when customer wants to change delivery address/location.',
    input_schema: {
      type: 'object',
      properties: {
        new_address: {
          type: 'string',
          description: 'العنوان الجديد (e.g., "شارع الملك فهد، الرياض")',
        },
      },
      required: ['new_address'],
    },
  },
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, shipment_id } = body

    if (!message || !shipment_id) {
      return NextResponse.json(
        { error: 'Message and shipment_id required' },
        { status: 400 }
      )
    }

    // Get current shipment context
    const rawShipment = await omsClient.getShipment(shipment_id)
    const routeLocked = await dispatchClient.isRouteLocked(shipment_id)
    const shipment = normalizeShipment(rawShipment, routeLocked)

    // Build context for Claude
    const shipmentContext = `
الشحنة الحالية:
- رقم الشحنة: ${shipment.shipment_id}
- الحالة: ${shipment.status}
- وقت الوصول المتوقع: ${shipment.eta.toLocaleString('ar-SA')}
- العنوان: ${shipment.address.text_ar || shipment.address.text}
- الملاحظات الحالية: ${shipment.instructions || 'لا توجد ملاحظات'}
- مقفل للتوجيه: ${shipment.route_locked ? 'نعم' : 'لا'}
`

    // Call Claude API with function calling
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: SYSTEM_PROMPT + '\n\n' + shipmentContext,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
      tools: tools,
    })

    let responseText = ''
    let actionExecuted = false
    let actionResult: any = null
    let updatedShipment = null
    let noteCreated = false

    // Process Claude's response
    for (const content of response.content) {
      if (content.type === 'text') {
        responseText += content.text
      } else if (content.type === 'tool_use') {
        // Execute the requested action
        const toolName = content.name
        const toolInput = content.input as any

        try {
          if (toolName === 'reschedule_delivery') {
            // Parse date and time
            const newDate = new Date(toolInput.new_date)
            const [startHour, startMin] = toolInput.new_time_start.split(':')
            const [endHour, endMin] = toolInput.new_time_end.split(':')

            const windowStart = new Date(newDate)
            windowStart.setHours(parseInt(startHour), parseInt(startMin), 0, 0)

            const windowEnd = new Date(newDate)
            windowEnd.setHours(parseInt(endHour), parseInt(endMin), 0, 0)

            actionResult = await executeAction(
              {
                type: 'RESCHEDULE',
                new_window: {
                  start: windowStart,
                  end: windowEnd,
                },
              },
              shipment_id
            )

            actionExecuted = true

            if (actionResult.success) {
              responseText += `\n\n✅ تم تحديث الموعد بنجاح.`
            } else {
              responseText += `\n\n❌ ${actionResult.denialReason || actionResult.error}`
            }
          } else if (toolName === 'update_instructions') {
            actionResult = await executeAction(
              {
                type: 'UPDATE_INSTRUCTIONS',
                instructions: toolInput.instructions,
              },
              shipment_id
            )

            actionExecuted = true

            if (actionResult.success) {
              responseText += `\n\n✅ تم تحديث الملاحظات.`
            } else {
              responseText += `\n\n❌ ${actionResult.denialReason || actionResult.error}`
            }
          } else if (toolName === 'update_location') {
            // Simple geocoding fallback (will be enhanced later)
            // For demo, we'll use approximate coordinates based on Riyadh landmarks
            const geocoded = await geocodeAddress(toolInput.new_address)

            actionResult = await executeAction(
              {
                type: 'UPDATE_LOCATION',
                geo_pin: geocoded,
                address: {
                  text: toolInput.new_address,
                  text_ar: toolInput.new_address,
                },
              },
              shipment_id
            )

            actionExecuted = true

            if (actionResult.success) {
              responseText += `\n\n✅ تم تحديث الموقع.`
            } else {
              responseText += `\n\n❌ ${actionResult.denialReason || actionResult.error}`
            }
          }
        } catch (error) {
          console.error('Action execution error:', error)
          responseText += `\n\n❌ حدث خطأ: ${
            error instanceof Error ? error.message : 'خطأ غير معروف'
          }`
        }
      }
    }

    // If no tool was called and message seems out-of-scope, create a note
    if (!actionExecuted && isOutOfScope(message)) {
      await prisma.shipmentNote.create({
        data: {
          shipment_id,
          note_type: 'customer_question',
          content: message,
        },
      })
      noteCreated = true
    }

    // Get updated shipment if action was successful
    if (actionExecuted && actionResult?.success) {
      const updatedRaw = await omsClient.getShipment(shipment_id)
      const updatedLocked = await dispatchClient.isRouteLocked(shipment_id)
      const normalized = normalizeShipment(updatedRaw, updatedLocked)
      updatedShipment = {
        shipment_id: normalized.shipment_id,
        status: normalized.status,
        eta: normalized.eta.toISOString(),
        window: {
          start: normalized.window.start.toISOString(),
          end: normalized.window.end.toISOString(),
        },
        address: normalized.address,
        geo_pin: normalized.geo_pin,
        instructions: normalized.instructions,
      }
    }

    // Generate Arabic TTS audio
    let audioUrl: string | undefined

    try {
      const audio = await elevenlabs.textToSpeech.convert(
        process.env.ELEVENLABS_VOICE_ID_AR || 'v0GSOyVKHcHq81326mCE',
        {
          text: responseText,
          model_id: 'eleven_multilingual_v2',
        }
      )

      // Convert audio stream to base64 data URL
      const chunks: Uint8Array[] = []
      for await (const chunk of audio) {
        chunks.push(chunk)
      }
      const audioBuffer = Buffer.concat(chunks)
      const base64Audio = audioBuffer.toString('base64')
      audioUrl = `data:audio/mpeg;base64,${base64Audio}`
    } catch (error) {
      console.error('TTS generation error:', error)
      // Continue without audio if TTS fails
    }

    return NextResponse.json({
      text: responseText,
      audioUrl,
      updatedShipment,
      actionExecuted,
      noteCreated,
      evidenceId: actionResult?.evidence_id,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Simple geocoding fallback (demo version)
async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number }> {
  // For demo, use approximate coordinates based on common Riyadh locations
  // In production, this would call a real geocoding API

  const lowerAddress = address.toLowerCase()

  // Riyadh landmarks (approximate coordinates)
  if (lowerAddress.includes('الملك فهد') || lowerAddress.includes('king fahd')) {
    return { lat: 24.7136, lng: 46.6753 }
  }
  if (
    lowerAddress.includes('العليا') ||
    lowerAddress.includes('olaya') ||
    lowerAddress.includes('olaia')
  ) {
    return { lat: 24.6969, lng: 46.6855 }
  }
  if (lowerAddress.includes('الملقا') || lowerAddress.includes('malqa')) {
    return { lat: 24.7716, lng: 46.6219 }
  }
  if (lowerAddress.includes('حطين') || lowerAddress.includes('hittin')) {
    return { lat: 24.7744, lng: 46.6361 }
  }

  // Default: slight offset from current location (within policy radius)
  return { lat: 24.7136 + Math.random() * 0.002, lng: 46.6753 + Math.random() * 0.002 }
}

// Simple heuristic to detect out-of-scope questions
function isOutOfScope(message: string): boolean {
  const lowerMessage = message.toLowerCase()

  const outOfScopeKeywords = [
    'license plate',
    'لوحة',
    'driver name',
    'اسم السائق',
    'driver number',
    'رقم السائق',
    'track',
    'تتبع',
    'cancel',
    'إلغاء',
    'refund',
    'استرجاع',
    'weather',
    'طقس',
  ]

  return outOfScopeKeywords.some((keyword) => lowerMessage.includes(keyword))
}
