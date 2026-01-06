// Script to generate 10-second audio samples for each preset
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables from .env file manually
try {
  const envPath = fs.existsSync('.env.local') ? '.env.local' : '.env'
  const envFile = fs.readFileSync(envPath, 'utf-8')
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      process.env[key] = value
    }
  })
  console.log(`✓ Loaded environment variables from ${envPath}\n`)
} catch (error) {
  console.warn('⚠️  Warning: Could not load .env file\n')
}

// Sample text (approximately 10 seconds of Arabic speech)
const SAMPLE_TEXT = `مرحباً! أنا مساعد سام الصوتي. شحنتك في طريقها إليك اليوم.
هل تريد تغيير العنوان أو إعادة جدولة التسليم؟ يمكنني مساعدتك في ذلك بسرعة وسهولة.
نحن هنا لخدمتك على مدار الساعة.`

interface PresetConfig {
  name: string
  speed: number
  description: string
}

const PRESETS: PresetConfig[] = [
  {
    name: 'Premium',
    speed: 0.80,
    description: 'Slower, more deliberate speech for careful listening'
  },
  {
    name: 'Standard',
    speed: 1.00,
    description: 'Normal pace, balanced delivery'
  },
  {
    name: 'Peak',
    speed: 1.20,
    description: 'Fastest pace for high-throughput scenarios'
  }
]

async function generateAudioSample(preset: PresetConfig) {
  console.log(`\n🎙️  Generating ${preset.name} preset audio sample...`)
  console.log(`   Speed: ${preset.speed}x`)
  console.log(`   ${preset.description}`)

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY environment variable is required')
  }

  const voiceId = process.env.ELEVENLABS_VOICE_ID_AR || 'v0GSOyVKHcHq81326mCE'

  const elevenlabs = new ElevenLabsClient({ apiKey })

  try {
    const audio = await elevenlabs.textToSpeech.convert(voiceId, {
      text: SAMPLE_TEXT,
      modelId: 'eleven_multilingual_v2',
      voiceSettings: {
        stability: 0.5,
        similarityBoost: 0.75,
        style: 0,
        useSpeakerBoost: true,
        speed: preset.speed,
      }
    })

    // Convert stream to buffer
    const reader = audio.getReader()
    const chunks: Uint8Array[] = []
    let done = false

    while (!done) {
      const { value, done: streamDone } = await reader.read()
      if (value) chunks.push(value)
      done = streamDone
    }

    const audioBuffer = Buffer.concat(chunks)

    // Save to file
    const outputDir = process.cwd() // Already in dcl-app directory
    const filename = `sam-preset-${preset.name.toLowerCase()}-speed-${preset.speed}.mp3`
    const outputPath = path.join(outputDir, filename)

    fs.writeFileSync(outputPath, audioBuffer)

    console.log(`   ✅ Saved to: ${filename}`)
    console.log(`   Size: ${(audioBuffer.length / 1024).toFixed(2)} KB`)

    return outputPath
  } catch (error: any) {
    console.error(`   ❌ Error generating ${preset.name}:`)
    console.error(`      ${error.message || error}`)
    if (error.response?.data) {
      console.error(`      API Response:`, JSON.stringify(error.response.data, null, 2))
    }
    throw error
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  SAM Preset Audio Sample Generator')
  console.log('═══════════════════════════════════════════════════════')
  console.log('\nGenerating 10-second audio samples for all presets...\n')

  const results: string[] = []

  for (const preset of PRESETS) {
    try {
      const outputPath = await generateAudioSample(preset)
      results.push(outputPath)

      // Add delay between requests to respect rate limits
      if (preset !== PRESETS[PRESETS.length - 1]) {
        console.log('   ⏳ Waiting 2 seconds before next generation...')
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    } catch (error: any) {
      console.error(`\n❌ Failed to generate ${preset.name} preset: ${error.message || error}`)
    }
  }

  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  ✨ Generation Complete!')
  console.log('═══════════════════════════════════════════════════════')
  console.log(`\n📁 Generated ${results.length}/${PRESETS.length} audio files:`)
  results.forEach(file => console.log(`   - ${path.basename(file)}`))
  console.log('\n🎧 You can now listen to each preset to hear the speed differences!\n')
}

main().catch(console.error)
