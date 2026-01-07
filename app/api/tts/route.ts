import { NextRequest, NextResponse } from 'next/server'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

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

export async function POST(request: NextRequest) {
  const startTime = performance.now()

  try {
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY
    if (!elevenLabsKey) {
      return NextResponse.json({ error: 'TTS not configured' }, { status: 500 })
    }

    const elevenlabs = new ElevenLabsClient({ apiKey: elevenLabsKey })

    const body = await request.json()
    const { text, speed = 1.0 } = body

    if (!text) {
      return NextResponse.json({ error: 'Text required' }, { status: 400 })
    }

    const ttsText = prepareTextForTTS(text)
    const elevenLabsSpeed = Math.max(0.7, Math.min(1.2, speed))

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
    const audioUrl = 'data:audio/mpeg;base64,' + base64Audio

    return NextResponse.json({
      audioUrl,
      duration_ms: Math.round(performance.now() - startTime),
      text_length: text.length,
    })
  } catch (error) {
    console.error('TTS API error:', error)
    return NextResponse.json(
      { error: 'TTS generation failed' },
      { status: 500 }
    )
  }
}
