import { NextRequest, NextResponse } from 'next/server'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

// Prepare text for Arabic TTS - removes emojis and converts digits to Arabic words
function prepareTextForTTS(text: string): string {
  const arabicNumbers: Record<string, string> = {
    '0': 'صفر', '1': 'واحد', '2': 'اثنين', '3': 'ثلاثة', '4': 'أربعة',
    '5': 'خمسة', '6': 'ستة', '7': 'سبعة', '8': 'ثمانية', '9': 'تسعة',
    '10': 'عشرة', '11': 'أحد عشر', '12': 'اثنا عشر', '20': 'عشرين',
    '30': 'ثلاثين', '40': 'أربعين', '50': 'خمسين',
  }

  let result = text

  // Remove emojis
  result = result.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')

  // Convert standalone numbers (1-50) to Arabic words
  result = result.replace(/\b(\d{1,2})\b/g, (match) => {
    if (arabicNumbers[match]) return arabicNumbers[match]
    return match
  })

  return result.replace(/\n{3,}/g, '\n\n').replace(/  +/g, ' ').trim()
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
