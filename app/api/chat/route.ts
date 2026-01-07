export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import { executeAction } from '@/lib/orchestrator/executeAction'
import { omsClient } from '@/lib/tool-servers/oms'
import { normalizeShipment } from '@/lib/domain/normalize'
import { dispatchClient } from '@/lib/tool-servers/dispatch'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { resolvePolicy, type PolicyDocument } from '@/lib/policy'
import {
  getOrCreateConversation,
  transitionConversation,
  detectCustomerIntent,
  incrementActionsTaken
} from '@/lib/conversation'
// geocodeAddress removed - Phase 0 uses static addresses

// Generate unique conversation ID
function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// Emit telemetry event
async function emitTelemetry(event: {
  event: string
  environment?: string
  conversation_id?: string
  case_key?: string
  policy_id?: string
  policy_version?: string
  payload?: Record<string, unknown>
}) {
  try {
    await prisma.telemetryEvent.create({
      data: {
        event: event.event,
        environment: event.environment || 'prod',
        conversation_id: event.conversation_id || null,
        case_key: event.case_key || null,
        policy_id: event.policy_id || null,
        policy_version: event.policy_version || null,
        payload: (event.payload || {}) as Prisma.InputJsonValue,
      },
    })
  } catch (error) {
    console.error('Failed to emit telemetry:', error)
    // Don't throw - telemetry failures shouldn't break the conversation
  }
}

// Fast-path detection for simple queries (use Haiku)
function isSimpleQuery(message: string): boolean {
  const simplePatterns = [
    /^(السلام|مرحبا|هلا|اهلا|صباح|مساء)/i,  // Greetings
    /^(وين|فين|اين).*(طرد|شحن)/i,            // Where's my package
    /^(شكرا|مع السلامة|باي)/i,               // Thanks/goodbye
    /^(لا|لا شكرا|خلاص|تمام بس)/i,           // No thanks/done
    /^(ايه|نعم|اوكي|طيب|تمام)$/i,            // Yes/OK (short confirmations)
  ];
  return simplePatterns.some(p => p.test(message.trim()));
}

// Prepare text for Arabic TTS - removes emojis and converts digits to Arabic words
function prepareTextForTTS(text: string): string {
  // Arabic number words
  const arabicNumbers: Record<string, string> = {
    '0': 'صفر',
    '1': 'واحد',
    '2': 'اثنين',
    '3': 'ثلاثة',
    '4': 'أربعة',
    '5': 'خمسة',
    '6': 'ستة',
    '7': 'سبعة',
    '8': 'ثمانية',
    '9': 'تسعة',
    '10': 'عشرة',
    '11': 'أحد عشر',
    '12': 'اثنا عشر',
    '13': 'ثلاثة عشر',
    '14': 'أربعة عشر',
    '15': 'خمسة عشر',
    '16': 'ستة عشر',
    '17': 'سبعة عشر',
    '18': 'ثمانية عشر',
    '19': 'تسعة عشر',
    '20': 'عشرين',
    '30': 'ثلاثين',
    '40': 'أربعين',
    '50': 'خمسين',
  }

  // Common misspellings of Arabic numbers → correct spelling for TTS
  const spellingCorrections: Record<string, string> = {
    // Without hamza → with hamza
    'اربعة': 'أربعة',
    'اربعه': 'أربعة',
    'أربعه': 'أربعة',
    'اثنان': 'اثنين',
    'اثنتان': 'اثنتين',
    // Taa marbuta variants (ه instead of ة)
    'ثلاثه': 'ثلاثة',
    'خمسه': 'خمسة',
    'سته': 'ستة',
    'سبعه': 'سبعة',
    'ثمانيه': 'ثمانية',
    'تسعه': 'تسعة',
    'عشره': 'عشرة',
    // Compound numbers without hamza
    'اربعة عشر': 'أربعة عشر',
    'اربعه عشر': 'أربعة عشر',
    'احد عشر': 'أحد عشر',
    'اربعين': 'أربعين',
  }

  let result = text

  // Apply spelling corrections first
  for (const [wrong, correct] of Object.entries(spellingCorrections)) {
    result = result.replace(new RegExp(wrong, 'g'), correct)
  }

  // Remove emojis and special symbols
  result = result.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FEFF}]|[✅⚠️❌✓✗☑️🔴🟢🟡]/gu, '')

  // Convert shipment IDs like "SHP-2025-001" to spoken form
  result = result.replace(/SHP-(\d{4})-(\d{3})/gi, (_, year, num) => {
    return `شحنة رقم ${parseInt(num)}`
  })

  // Convert standalone numbers (1-50) to Arabic words
  // Match numbers that are standalone (not part of a larger word/code)
  result = result.replace(/\b(\d{1,2})\b/g, (match) => {
    const num = parseInt(match)
    if (arabicNumbers[match]) {
      return arabicNumbers[match]
    }
    // Handle 21-29, 31-39, 41-49 (compound numbers)
    if (num > 20 && num < 50) {
      const ones = num % 10
      const tens = Math.floor(num / 10) * 10
      if (ones === 0) return arabicNumbers[tens.toString()] || match
      return `${arabicNumbers[ones.toString()]} و${arabicNumbers[tens.toString()]}`
    }
    return match
  })

  // Clean up multiple spaces and newlines
  result = result.replace(/\n{3,}/g, '\n\n').replace(/  +/g, ' ').trim()

  return result
}

// Initialize clients inside the handler to ensure env vars are available

// System prompt for Claude (Arabic-first, conversational, task-focused)
const SYSTEM_PROMPT = `You are a smart delivery assistant for packages in Saudi Arabia. Your goal: Help customers modify delivery details quickly and accurately.

Personality:
- Concise: 1-2 sentences maximum per response (except when explaining policy rejection)
- Friendly: Use "حسناً", "تمام", "ما في مشكلة" (Saudi dialect)
- Proactive: If you can execute immediately, do it. Don't ask unnecessary questions

Language (very important):
- The default language is Arabic (Saudi dialect) always
- Don't switch to English unless the customer explicitly speaks in English
- Use Arabic script for all responses

Scope:
- In-scope (execute immediately): Reschedule, update notes, update location
- Out-of-scope (log + acknowledge): Driver details, license plate, etc.

Speed:
- Don't repeat what the user said
- Don't over-explain unless a policy prevented something
- Move to the solution quickly

Response Style:
- After completing ANY action (update instructions, reschedule, location change), you MUST:
  1. Confirm naturally in Arabic: "تمام، غيرت التعليمات" or "حسناً، عدلت الموقع"
  2. Then ask: "هل تحتاج شي ثاني؟"
- Keep confirmations brief but ALWAYS confirm the action was done
- Don't echo system messages like "Notes updated" - use your own words in Arabic
- When customer asks for multiple things, address EACH request separately
- Example: Customer says "غير الكود وضاعف الكمية"
  → You: "تمام، غيرت الكود. بالنسبة للكمية، سياسة النظام ما تسمح بتعديلها حالياً. هل تحتاج شي ثاني؟"
- ALWAYS acknowledge what succeeded AND what failed
- NEVER ignore part of the customer's request

Conversation Flow (critical):
- NEVER greet the customer again if you've already greeted them in this conversation
- If conversation status is ACTIVE or RESOLVED, skip the greeting and go straight to helping
- Only greet on the very first message when status is OPEN
- ALWAYS ask "هل تحتاج شي ثاني؟" after completing any action
- If customer says no/thanks (لا، شكراً، خلاص، تمام بس): close with "شكراً لتواصلك، مع السلامة!"
- If customer asks something else: help them, then ask again
- Never leave the customer hanging - either help more or close the conversation

Multiple Requests in One Message:
- If customer asks for multiple things in one message, process ALL of them
- Confirm each action separately: "تمام، غيرت الكود. بالنسبة للكمية، ما نقدر نغيرها حالياً."
- Always end with "هل تحتاج شي ثاني؟" even if some actions failed
- Never leave the customer without knowing what happened to EACH request

Examples:
- Customer: "غير كود الدخول إلى 772"
- You: "تمام، غيرت كود الدخول. هل تحتاج شي ثاني؟"

- Customer: "لا شكراً"
- You: "العفو، شكراً لتواصلك! مع السلامة"

Package Content (trusted caller):
- You are speaking with a trusted caller (registered and known number)
- When the customer asks about package content, tell them the content directly and mention they are a trusted caller
- Example: "Since you're calling from a trusted number, your package contains: ..."

Content Modification:
- If the customer requests to modify/multiply/increase quantity, use modify_content tool
- The tool will check the policy and determine if it's allowed
- If not allowed, politely inform them and offer to log their request for the sales team

Examples:
User: "شو في الطرد؟"
You: "بما إنك تتصل من رقم موثوق، طردك يحتوي على: [content from context]"

User: "أبي أضاعف الكمية"
You: [Use modify_content tool to check]

User: "أبي أغير الوقت"
You: "متى تفضل؟"

Numbers and Formatting (Saudi business standard):
- Use Western digits (1, 2, 3) for all numbers - this is standard in Saudi logistics
- Times: "الساعة 2" or "2:00 PM" - NOT spelled out as words
- Dates: "15 يناير" or "January 15" - keep digits
- Keep tracking IDs exactly as-is: "SHP-2025-003"
- Never use emojis in your responses

Available Tools:
1. reschedule_delivery - Change delivery time
2. update_instructions - Update delivery notes
3. update_location - Change delivery location
4. modify_content - Request to modify/multiply order content

Use tools only when needed. If the request is out of scope, log it as a note and respond politely.`

// Function definitions for Claude
const tools: Anthropic.Messages.Tool[] = [
  {
    name: 'reschedule_delivery',
    description: 'Reschedule delivery appointment to a new time. Use when customer wants to change delivery time/date.',
    input_schema: {
      type: 'object',
      properties: {
        new_date: {
          type: 'string',
          description: 'New date in ISO format (e.g., 2025-01-15)',
        },
        new_time_start: {
          type: 'string',
          description: 'Start time in HH:MM format (e.g., 14:00)',
        },
        new_time_end: {
          type: 'string',
          description: 'End time in HH:MM format (e.g., 16:00)',
        },
      },
      required: ['new_date', 'new_time_start', 'new_time_end'],
    },
  },
  {
    name: 'update_instructions',
    description: 'Update delivery notes or instructions. Use when customer wants to add/change delivery notes.',
    input_schema: {
      type: 'object',
      properties: {
        instructions: {
          type: 'string',
          description: 'New delivery notes (e.g., "Leave package at the door")',
        },
      },
      required: ['instructions'],
    },
  },
  {
    name: 'update_location',
    description: 'Change delivery location. Use when customer wants to change delivery address/location.',
    input_schema: {
      type: 'object',
      properties: {
        new_address: {
          type: 'string',
          description: 'New address (e.g., "King Fahd Street, Riyadh")',
        },
      },
      required: ['new_address'],
    },
  },
  {
    name: 'modify_content',
    description: 'Request to modify or multiply order content. Use when customer wants to double, triple, or modify order quantity.',
    input_schema: {
      type: 'object',
      properties: {
        multiplier: {
          type: 'number',
          description: 'Requested multiplier (e.g., 2 for double, 3 for triple)',
        },
        request_details: {
          type: 'string',
          description: 'Order details as mentioned by customer',
        },
      },
      required: ['multiplier', 'request_details'],
    },
  },
]

export async function POST(request: NextRequest) {
  const timings: Record<string, number> = {}
  const startTime = performance.now()
  const conversationId = generateConversationId()
  let activePolicy: PolicyDocument | null = null

  try {
    // Quick DB health check (fail fast if DB is down)
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (dbError) {
      console.error('[DB] Connection failed:', dbError)
      return NextResponse.json(
        { error: 'Database temporarily unavailable. Please try again in a few seconds.' },
        { status: 503 }
      )
    }

    // Verify API keys are present
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY

    console.log('Anthropic key exists:', !!anthropicKey)
    console.log('Anthropic key length:', anthropicKey?.length)

    if (!anthropicKey || !elevenLabsKey) {
      console.error('Missing API keys')
      return NextResponse.json(
        { error: 'Server configuration error: Missing API keys' },
        { status: 500 }
      )
    }

    // Initialize clients with environment variables
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const elevenlabs = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    })

    const body = await request.json()
    const { message, shipment_id, conversation_id: existingConvId, env: requestEnv } = body
    const convId = existingConvId || conversationId

    // Check if TTS should be skipped (for text-first response)
    const skipTTS = request.nextUrl.searchParams.get('skipTTS') === 'true'

    // Environment selection: default to 'dev' for safety, allow override
    const validEnvs = ['dev', 'staging', 'prod'] as const
    const policyEnv = validEnvs.includes(requestEnv) ? requestEnv : 'dev'

    if (!message || !shipment_id) {
      return NextResponse.json(
        { error: 'Message and shipment_id required' },
        { status: 400 }
      )
    }

    // Fetch active policy from v2.1 Policy Engine for the selected environment
    const policyRecord = await prisma.policy.findFirst({
      where: { environment: policyEnv, active: true, effective_at: { lte: new Date() } },
      orderBy: [{ effective_at: 'desc' }, { created_at: 'desc' }],
    })

    if (policyRecord) {
      activePolicy = resolvePolicy(policyRecord.document as unknown as PolicyDocument)
    }

    // Extract resolved policy values (with defaults)
    const speechPace = activePolicy?.dials.speech_pace.tts_rate_multiplier ?? 1.0
    const conversationalProfile = activePolicy?.dials.conversational_mode.profile ?? 'balanced'
    const verbosityBudget = activePolicy?.dials.conversational_mode.verbosity_budget_tokens ?? 170
    const maxClarifiers = activePolicy?.dials.clarification_budget.max_clarifying_questions ?? 3
    const confirmationMode = activePolicy?.dials.confirmation_rigor.mode ?? 'risk_based'
    const autonomyMode = activePolicy?.dials.autonomy_scope.mode ?? 'confirm_then_act'

    // Emit conversation.started telemetry (only for new conversations)
    if (!existingConvId) {
      await emitTelemetry({
        event: 'conversation.started',
        environment: policyEnv,
        conversation_id: convId,
        case_key: shipment_id,
        policy_id: activePolicy?.policy_id,
        policy_version: activePolicy?.policy_version,
        payload: {
          dials: activePolicy?.dials ? {
            speech_pace: activePolicy.dials.speech_pace.ui_value,
            conversational_mode: activePolicy.dials.conversational_mode.ui_value,
            clarification_budget: activePolicy.dials.clarification_budget.ui_value,
            confirmation_rigor: activePolicy.dials.confirmation_rigor.ui_value,
            autonomy_scope: activePolicy.dials.autonomy_scope.ui_value,
          } : null,
        },
      })
    }

    // Parallel fetch: shipment, route lock, conversation, policy config, intent detection
    const [rawShipment, routeLocked, conversation, policyConfig, intent] = await Promise.all([
      omsClient.getShipment(shipment_id),
      dispatchClient.isRouteLocked(shipment_id),
      getOrCreateConversation(shipment_id),
      prisma.policyConfig.findFirst({ orderBy: { updated_at: 'desc' } }),
      detectCustomerIntent(message),
    ])
    timings.parallelFetch = performance.now() - startTime

    if (!rawShipment) {
      return NextResponse.json(
        {
          text: 'عذراً، ما قدرت ألاقي الشحنة. تواصل مع الدعم الفني.',
          error: 'Shipment not found - database may need seeding'
        },
        { status: 404 }
      )
    }

    const shipment = normalizeShipment(rawShipment, routeLocked)

    // Transition conversation state (depends on conversation + intent from parallel fetch)
    await transitionConversation(conversation.id, intent)
    timings.conversationTransition = performance.now() - startTime

    const maxContentMultiplier = policyConfig?.max_content_multiplier ?? 0

    // Build policy-driven style directive
    const styleDirective = conversationalProfile === 'concierge'
      ? 'Be friendly and detailed, use warm greetings.'
      : conversationalProfile === 'transactional'
      ? 'Be very concise and direct. One or two sentences only.'
      : 'Be friendly but concise. 1-2 sentences maximum.'

    const autonomyDirective = autonomyMode === 'auto_act'
      ? 'Execute actions immediately without asking for additional confirmation (if clear).'
      : autonomyMode === 'suggest_only'
      ? 'Only suggest solutions and wait for customer approval before executing.'
      : 'Request simple confirmation before executing important actions.'

    // Build context for Claude
    const shipmentContext = `
Current Shipment:
- Shipment Number: ${shipment.shipment_id}
- Status: ${shipment.status}
- Expected Arrival Time: ${shipment.eta.toLocaleString('en-US')}
- Address: ${shipment.address.text_ar || shipment.address.text}
- Package Content: ${shipment.package_content || 'Not specified'}
- Current Notes: ${shipment.instructions || 'No notes'}
- Route Locked: ${shipment.route_locked ? 'Yes' : 'No'}

Content Modification Policy:
- Maximum Multiplier: ${maxContentMultiplier === 0 ? 'Not allowed' : maxContentMultiplier + 'x'}

Style Directives (According to Operations Policy):
- ${styleDirective}
- ${autonomyDirective}
- Maximum Clarifying Questions: ${maxClarifiers}
`

    // Build conversation status context for closing behavior
    const conversationStatusContext = `
Conversation Status: ${conversation.status}

Closing Behavior:
- If status is ACTIVE and you just completed an action: end with "هل تحتاج شي ثاني؟"
- If status is RESOLVED: say brief goodbye "شكراً لتواصلك، مع السلامة!"
- If status is CLOSED: customer already left, keep response minimal
`

    // Select model based on query complexity (Haiku for simple, Sonnet for complex)
    const useHaiku = isSimpleQuery(message)
    const selectedModel = useHaiku
      ? 'claude-3-5-haiku-20241022'  // Fast for simple queries
      : 'claude-sonnet-4-20250514'   // Full power for actions

    // Call Claude API with streaming
    timings.preClaudeCall = performance.now() - startTime
    const stream = anthropic.messages.stream({
      model: selectedModel,
      max_tokens: useHaiku ? 512 : 1024,  // Smaller budget for simple queries
      system: SYSTEM_PROMPT + '\n\n' + shipmentContext + conversationStatusContext,
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
    // Accumulate results from multiple tool calls
    const actionResults: { tool: string; success: boolean; message: string }[] = []

    // Stream text as it arrives
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        responseText += event.delta.text
      }
    }
    timings.claudeResponse = performance.now() - startTime

    // Get final message for complete tool_use handling
    const finalMessage = await stream.finalMessage()

    // Process tool calls from final message
    for (const content of finalMessage.content) {
      if (content.type === 'tool_use') {
        // Execute the requested action
        const toolName = content.name
        const toolInput = content.input as Record<string, any>

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
            if (actionResult?.success) {
              actionResults.push({ tool: 'reschedule', success: true, message: 'تمام، غيرت موعد التوصيل' })
            } else {
              actionResults.push({ tool: 'reschedule', success: false, message: 'ما قدرت أغير الموعد' })
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
            if (actionResult?.success) {
              actionResults.push({ tool: 'update_instructions', success: true, message: 'تمام، حدثت التعليمات' })
            } else {
              actionResults.push({ tool: 'update_instructions', success: false, message: 'ما قدرت أحدث التعليمات' })
            }
          } else if (toolName === 'update_location') {
            // Phase 0 Demo: Accept any address without geocoding
            // Use existing coordinates with small offset for demo purposes
            actionResult = await executeAction(
              {
                type: 'UPDATE_LOCATION',
                geo_pin: { lat: shipment.geo_pin.lat + 0.001, lng: shipment.geo_pin.lng + 0.001 },
                address: {
                  text: toolInput.new_address,
                  text_ar: toolInput.new_address,
                },
              },
              shipment_id
            )

            actionExecuted = true
            if (actionResult?.success) {
              actionResults.push({ tool: 'update_location', success: true, message: 'تمام، غيرت الموقع' })
            } else {
              actionResults.push({ tool: 'update_location', success: false, message: 'ما قدرت أغير الموقع' })
            }
          } else if (toolName === 'modify_content') {
            // Check policy for content modification
            const requestedMultiplier = toolInput.multiplier || 2

            if (maxContentMultiplier === 0) {
              // Not allowed - create a note for sales team
              await prisma.shipmentNote.create({
                data: {
                  shipment_id,
                  note_type: 'content_modification_request',
                  content: `Content modification request: ${toolInput.request_details} (${requestedMultiplier}x multiply)`,
                },
              })
              noteCreated = true
              actionResults.push({ tool: 'modify_content', success: false, message: 'سياسة النظام ما تسمح بتعديل الكمية حالياً، سجلت طلبك للمتابعة' })
            } else if (requestedMultiplier <= maxContentMultiplier) {
              // Allowed - create a note for processing
              await prisma.shipmentNote.create({
                data: {
                  shipment_id,
                  note_type: 'content_modification_approved',
                  content: `Approved multiplication request: ${toolInput.request_details} (${requestedMultiplier}x) - Awaiting confirmation and billing`,
                },
              })
              noteCreated = true
              actionResults.push({ tool: 'modify_content', success: true, message: 'تم تسجيل طلب تعديل الكمية' })
            } else {
              // Multiplier too high
              await prisma.shipmentNote.create({
                data: {
                  shipment_id,
                  note_type: 'content_modification_request',
                  content: `Content modification request (${requestedMultiplier}x) - Exceeds allowed limit (${maxContentMultiplier}x)`,
                },
              })
              noteCreated = true
              actionResults.push({ tool: 'modify_content', success: false, message: `أقصى حد للمضاعفة هو ${maxContentMultiplier}x، سجلت طلبك للمراجعة` })
            }
            actionExecuted = true
          }
        } catch (error) {
          console.error('Action execution error:', error)
          responseText += `\n\nعذراً، صار خطأ: ${
            error instanceof Error ? error.message : 'خطأ غير معروف'
          }`
        }
      }
    }
    if (actionExecuted) {
      timings.toolExecution = performance.now() - startTime
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

    // Build combined response from all action results
    if (actionResults.length > 0) {
      const messages = actionResults.map(r => r.message)
      responseText = messages.join('. ') + '. هل تحتاج شي ثاني؟'

      // Track if ANY action succeeded for state transition
      const anySuccess = actionResults.some(r => r.success)
      if (anySuccess) {
        await transitionConversation(conversation.id, 'ACTION_COMPLETED')
        await incrementActionsTaken(conversation.id)

        // Fetch updated shipment
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
    } else if (!responseText.trim()) {
      // No tools called and Claude didn't provide text
      responseText = 'كيف أقدر أساعدك؟'
    }

    // Fast path: Return text immediately without TTS (client fetches audio separately)
    if (skipTTS) {
      timings.total = performance.now() - startTime
      return NextResponse.json({
        text: responseText,
        audioUrl: null,
        updatedShipment,
        actionExecuted,
        noteCreated,
        evidenceId: actionResult?.evidence_id,
        conversation_id: convId,
        policy_applied: activePolicy ? {
          policy_id: activePolicy.policy_id,
          policy_version: activePolicy.policy_version,
          environment: policyEnv,
          conversational_profile: conversationalProfile,
          autonomy_mode: autonomyMode,
        } : null,
        environment: policyEnv,
        model_used: selectedModel,
        fast_path: useHaiku,
        skip_tts: true,
        _timings: timings,
      })
    }

    // Generate Arabic TTS audio
    let audioUrl: string | undefined
    timings.preTTS = performance.now() - startTime

    try {
      // Preprocess text for cleaner TTS (remove emojis, convert numbers to Arabic words)
      const ttsText = prepareTextForTTS(responseText)

      // Map speechPace to ElevenLabs speed range (0.7 - 1.2)
      // If speechPace is already a multiplier (0.7-1.2), use it directly
      // Otherwise assume it needs mapping from policy dial value
      const elevenLabsSpeed = speechPace >= 0.7 && speechPace <= 1.2
        ? speechPace
        : 1.0

      const audio = await elevenlabs.textToSpeech.convert(
        process.env.ELEVENLABS_VOICE_ID_AR || 'v0GSOyVKHcHq81326mCE',
        {
          text: ttsText,
          modelId: 'eleven_multilingual_v2',
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0,
            useSpeakerBoost: true,
            speed: elevenLabsSpeed,
          }
        }
      )

      // Convert audio stream to base64 data URL
      const reader = audio.getReader()
      const chunks: Uint8Array[] = []
      let done = false

      while (!done) {
        const { value, done: streamDone } = await reader.read()
        if (value) chunks.push(value)
        done = streamDone
      }

      const audioBuffer = Buffer.concat(chunks)
      const base64Audio = audioBuffer.toString('base64')
      audioUrl = `data:audio/mpeg;base64,${base64Audio}`
      timings.ttsResponse = performance.now() - startTime
    } catch (error) {
      console.error('TTS generation error:', error)
      timings.ttsResponse = performance.now() - startTime
      // Continue without audio if TTS fails
    }

    // Emit action.executed telemetry if an action was performed
    if (actionExecuted) {
      await emitTelemetry({
        event: 'action.executed',
        environment: policyEnv,
        conversation_id: convId,
        case_key: shipment_id,
        policy_id: activePolicy?.policy_id,
        policy_version: activePolicy?.policy_version,
        payload: {
          action_success: actionResult?.success ?? false,
          evidence_id: actionResult?.evidence_id,
        },
      })
    }

    // Calculate metrics for this turn
    timings.total = performance.now() - startTime
    console.log('[TIMING]', JSON.stringify(timings))

    return NextResponse.json({
      text: responseText,
      audioUrl,
      updatedShipment,
      actionExecuted,
      noteCreated,
      evidenceId: actionResult?.evidence_id,
      conversation_id: convId,
      policy_applied: activePolicy ? {
        policy_id: activePolicy.policy_id,
        policy_version: activePolicy.policy_version,
        environment: policyEnv,
        conversational_profile: conversationalProfile,
        autonomy_mode: autonomyMode,
      } : null,
      environment: policyEnv,
      model_used: selectedModel,
      fast_path: useHaiku,
      _timings: timings,
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

// Simple heuristic to detect out-of-scope questions
function isOutOfScope(message: string): boolean {
  const lowerMessage = message.toLowerCase()

  const outOfScopeKeywords = [
    'license plate',
    'driver name',
    'driver number',
    'track',
    'cancel',
    'refund',
    'weather',
  ]

  return outOfScopeKeywords.some((keyword) => lowerMessage.includes(keyword))
}
