# SAM v2 - Telephony Integration Research & Analysis

**Project:** Smart Autonomous Manager (SAM)
**Feature:** Traditional Telephony (Inbound Voice Calls)
**Research Date:** December 31, 2025
**Status:** Evaluation Phase

---

## 📋 Executive Summary

This document presents comprehensive research on adding traditional telephony capabilities to SAM, enabling customers to call a phone number and interact with the AI voice agent (same experience as the web voice chat interface).

### **Three Solutions Evaluated:**

1. **Twilio + Claude ConversationRelay** - Custom development, lowest cost per minute
2. **Seasalt.ai** - All-in-one platform, does NOT use Claude
3. **Autocalls.ai** - No-code platform, native Claude integration

### **Quick Recommendation:**

**Phase 1:** Start with **Autocalls.ai** (30 min setup, $0.09/min)
**Phase 2:** Migrate to **Twilio** if volume exceeds 500 calls/month ($0.013/min)

---

## 🎯 Business Requirements

### **What We Need:**

- ✅ Customers can call a Saudi phone number
- ✅ Hear the same SAM AI agent (Arabic voice)
- ✅ Ask about shipments (with tracking number)
- ✅ Reschedule deliveries
- ✅ Update delivery addresses
- ✅ Update delivery instructions
- ✅ Same policy enforcement (OTP, PII redaction, confirmation rigor)
- ✅ Same audit trail (evidence ledger)
- ✅ Low latency (< 1 second response time)

### **What We Already Have:**

- ✅ Claude (Anthropic) integration for conversational AI
- ✅ ElevenLabs Arabic voice synthesis
- ✅ Policy engine with 5 dials (speech pace, conversational mode, etc.)
- ✅ Orchestrator for action execution
- ✅ Evidence ledger for compliance
- ✅ Shipment management system

### **What We Need to Add:**

- Phone number (Saudi Arabia)
- Telephony infrastructure
- Speech-to-text (caller → text)
- Text-to-speech (agent → audio) - *or reuse ElevenLabs*
- WebSocket for real-time audio streaming
- Integration with existing SAM logic

---

## 🔬 Research Methodology

### **Platforms Evaluated:**

1. **Twilio** - Industry leader, official Claude integration
2. **Seasalt.ai** - Recommended by competitor analysis (Maqsam uses similar)
3. **Autocalls.ai** - Modern AI-first platform with Claude support

### **Evaluation Criteria:**

- ✅ Claude (Anthropic) integration capability
- ✅ Arabic language support
- ✅ Cost per minute
- ✅ Setup complexity
- ✅ Development time required
- ✅ Scalability (concurrent calls)
- ✅ Voice quality
- ✅ Compliance (GDPR, PII protection)
- ✅ Integration with existing SAM codebase

---

## 📊 Platform Comparison Matrix

| Feature | **Twilio + Claude** | **Seasalt.ai** | **Autocalls.ai** |
|---------|-------------------|----------------|------------------|
| **PRICING** | | | |
| Cost per minute | $0.013-0.025 ⭐ | $0.15 ❌ | $0.09 ✅ |
| Phone number | $1-5/month | Included | Included |
| Monthly minimum | ~$2 | Contact sales | $0 (pay as you go) ⭐ |
| Volume discounts | Yes | Unknown | Yes |
| **TECHNICAL** | | | |
| Setup complexity | Medium | Low | Very Low ⭐ |
| Implementation time | 3-4 hours | Contact sales | < 30 minutes ⭐ |
| Developer control | Full ⭐ | Limited | Limited |
| Custom code required | Yes | No | No ⭐ |
| **AI INTEGRATION** | | | |
| Claude integration | ✅ Native (ConversationRelay) | ❌ Uses own NLP | ✅ Native (5 min) ⭐ |
| Anthropic API reuse | ✅ Yes | ❌ No | ✅ Yes ⭐ |
| ElevenLabs support | ✅ Possible (custom) | ❌ Uses SeaVoice | ❌ Uses own TTS |
| System prompt control | ✅ Full | ⚠️ Limited | ✅ Full ⭐ |
| **VOICE FEATURES** | | | |
| Arabic support | ✅ Excellent | ✅ Excellent | ✅ 100+ languages |
| Voice options | Built-in TTS | Customizable | 300+ voices + cloning ⭐ |
| Interruption handling | ✅ Built-in | ✅ Built-in | ✅ Built-in (barge-in) |
| Voice quality | High | High | High |
| **SCALABILITY** | | | |
| Parallel calls | Unlimited ⭐ | Not specified | 50+ simultaneous |
| Phone numbers | 150+ countries ⭐ | Via Twilio | 150+ countries ⭐ |
| Uptime SLA | 99.95% | Unknown | Not specified |
| **INTEGRATIONS** | | | |
| CRM integrations | Custom code | Built-in omnichannel | 300+ no-code ⭐ |
| Webhook support | ✅ Full | ✅ Yes | ✅ Yes |
| API access | ✅ Full REST API ⭐ | Limited | REST API |
| WebSocket support | ✅ Yes ⭐ | Yes | Yes |
| **COMPLIANCE** | | | |
| GDPR compliant | ✅ Yes | ✅ Yes (HIPAA too) | ✅ Yes |
| SOC 2 | ✅ Certified | Unknown | In progress |
| Call recording | ✅ Optional | ✅ Yes | ✅ Yes |
| Data residency | Configurable | Unknown | Unknown |
| **SUPPORT** | | | |
| Documentation | ✅ Excellent ⭐ | Good | Good |
| Community | ✅ Large ⭐ | Small | Growing |
| 24/7 Support | ✅ Paid plans | Unknown | Email/Chat |

**Legend:**
⭐ = Best in category
✅ = Supported
⚠️ = Partial support
❌ = Not supported / Major limitation

---

## 💰 Detailed Cost Analysis

### **Scenario 1: Low Volume (100 calls/month, 3 min avg)**

**300 minutes/month**

| Platform | Per-Minute | Call Cost | Phone # | Monthly Total |
|----------|-----------|-----------|---------|---------------|
| Twilio | $0.013 | $3.90 | $2 | **$5.90** ⭐ |
| Autocalls.ai | $0.09 | $27 | $0 | **$27** |
| Seasalt.ai | $0.15 | $45 | ? | **$45+** |

**Winner:** Twilio (but dev cost = $200-400 for 3-4 hours)

---

### **Scenario 2: Medium Volume (500 calls/month, 3 min avg)**

**1,500 minutes/month**

| Platform | Per-Minute | Call Cost | Phone # | Monthly Total |
|----------|-----------|-----------|---------|---------------|
| Twilio | $0.013 | $19.50 | $2 | **$21.50** ⭐ |
| Autocalls.ai | $0.09 | $135 | $0 | **$135** |
| Seasalt.ai | $0.15 | $225 | ? | **$225+** |

**Winner:** Twilio (saving $113.50/month vs Autocalls.ai)

---

### **Scenario 3: High Volume (1,000 calls/month, 3 min avg)**

**3,000 minutes/month**

| Platform | Per-Minute | Call Cost | Phone # | Monthly Total |
|----------|-----------|-----------|---------|---------------|
| Twilio | $0.013 | $39 | $2 | **$41** ⭐ |
| Autocalls.ai | $0.09 | $270 | $0 | **$270** |
| Seasalt.ai | $0.15 | $450 | ? | **$450+** |

**Winner:** Twilio (saving $229/month vs Autocalls.ai)

---

### **Scenario 4: Enterprise Volume (5,000 calls/month, 3 min avg)**

**15,000 minutes/month**

| Platform | Per-Minute | Call Cost | Phone # | Monthly Total |
|----------|-----------|-----------|---------|---------------|
| Twilio | $0.013 | $195 | $2 | **$197** ⭐ |
| Autocalls.ai | $0.09* | $1,215* | $0 | **$1,215** |
| Seasalt.ai | $0.15* | $2,250* | ? | **$2,250+** |

*Volume discounts may apply

**Winner:** Twilio (saving $1,018/month vs Autocalls.ai)

---

### **Break-Even Analysis**

**Question:** At what call volume does Twilio become cheaper than Autocalls.ai?

**Calculation:**
- Twilio development cost: $200-400 (one-time, 3-4 hours @ $50-100/hour)
- Twilio monthly savings: $0.077/minute ($0.09 - $0.013)

**Break-even scenarios:**

| Dev Cost | Minutes Needed | Calls Needed (3min avg) | Months to ROI |
|----------|---------------|------------------------|---------------|
| $200 | 2,597 min | ~866 calls | **1 month** at 1000 calls/mo |
| $300 | 3,896 min | ~1,299 calls | **1.3 months** at 1000 calls/mo |
| $400 | 5,195 min | ~1,732 calls | **1.7 months** at 1000 calls/mo |

**Conclusion:** If you expect **> 350 calls/month**, Twilio pays for itself in Month 1.

---

### **Total Cost of Ownership (TCO) - 12 Months**

**Assuming 1,000 calls/month (3 min avg):**

| Platform | Month 1 | Months 2-12 | Year 1 Total |
|----------|---------|-------------|--------------|
| **Twilio** | $41 + $300 dev = $341 | $41 × 11 = $451 | **$792** ⭐ |
| **Autocalls.ai** | $270 | $270 × 11 = $2,970 | **$3,240** |
| **Seasalt.ai** | $450+ | $450 × 11 = $4,950 | **$5,400+** |

**Savings (Twilio vs Autocalls.ai):** $2,448/year
**Savings (Twilio vs Seasalt.ai):** $4,608/year

---

## 🏗️ Technical Architecture

### **Option 1: Twilio + Claude ConversationRelay**

```
┌─────────────────────────────────────────────────────────────┐
│                        CALLER                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  TWILIO PHONE NUMBER                         │
│                    (+966 xxx xxxx)                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               TWILIO VOICE WEBHOOK                           │
│          POST /api/voice (TwiML Response)                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            TWILIO CONVERSATIONRELAY                          │
│         (Bidirectional WebSocket Stream)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              SAM SERVER (Next.js)                            │
│         WebSocket: /api/voice/stream                         │
│                                                              │
│  ┌───────────────────────────────────────────────┐         │
│  │  Speech-to-Text (Twilio or Google)            │         │
│  └────────────────────┬──────────────────────────┘         │
│                       │                                      │
│                       ▼                                      │
│  ┌───────────────────────────────────────────────┐         │
│  │  Conversation Handler                         │         │
│  │  (Shared: Web + Phone)                        │         │
│  └────────────────────┬──────────────────────────┘         │
│                       │                                      │
│                       ▼                                      │
│  ┌───────────────────────────────────────────────┐         │
│  │  Claude API (Anthropic)                       │         │
│  │  - System prompt (from policy engine)         │         │
│  │  - User input (from caller)                   │         │
│  │  - Tool calls (shipment lookup, etc.)         │         │
│  └────────────────────┬──────────────────────────┘         │
│                       │                                      │
│                       ▼                                      │
│  ┌───────────────────────────────────────────────┐         │
│  │  Orchestrator                                 │         │
│  │  - Execute actions (reschedule, update)       │         │
│  │  - Query OMS/Dispatch                         │         │
│  │  - Log to evidence ledger                     │         │
│  └────────────────────┬──────────────────────────┘         │
│                       │                                      │
│                       ▼                                      │
│  ┌───────────────────────────────────────────────┐         │
│  │  Text-to-Speech                               │         │
│  │  Option A: Twilio built-in (Arabic)           │         │
│  │  Option B: ElevenLabs API (same voice as web) │         │
│  └────────────────────┬──────────────────────────┘         │
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │
                        ▼
                  Audio Stream
                        │
                        ▼
                     CALLER
```

**Key Components:**

1. **Twilio Voice Webhook** (`/api/voice/route.ts`)
   - Receives incoming call
   - Returns TwiML with ConversationRelay URL
   - Initiates WebSocket connection

2. **WebSocket Stream Handler** (`/api/voice/stream/route.ts`)
   - Receives audio stream from Twilio
   - Converts audio to text (STT)
   - Sends to conversation handler
   - Receives text response
   - Converts to audio (TTS)
   - Streams back to Twilio

3. **Conversation Handler** (`lib/conversation-handler.ts`)
   - Shared logic for web + phone
   - Extracts user intent
   - Calls Claude API
   - Executes actions via orchestrator
   - Returns response text

4. **Integration Points:**
   - Policy engine (speech pace, conversational mode)
   - Orchestrator (shipment actions)
   - Evidence ledger (audit trail)
   - OMS/Dispatch (data queries)

---

### **Option 2: Seasalt.ai**

```
┌─────────────────────────────────────────────────────────────┐
│                        CALLER                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               SEASALT.AI PLATFORM                            │
│                                                              │
│  ┌───────────────────────────────────────────────┐         │
│  │  Phone Number (via Twilio partnership)        │         │
│  └────────────────────┬──────────────────────────┘         │
│                       │                                      │
│                       ▼                                      │
│  ┌───────────────────────────────────────────────┐         │
│  │  SeaVoice (Speech Recognition)                │         │
│  │  - Arabic dialect support                     │         │
│  │  - Customizable voice profiles                │         │
│  └────────────────────┬──────────────────────────┘         │
│                       │                                      │
│                       ▼                                      │
│  ┌───────────────────────────────────────────────┐         │
│  │  SeaWord (NLP Engine)                         │         │
│  │  ⚠️ NOT Claude - Their own NLP                │         │
│  └────────────────────┬──────────────────────────┘         │
│                       │                                      │
│                       ▼                                      │
│  ┌───────────────────────────────────────────────┐         │
│  │  Conversation Flow Builder                    │         │
│  │  - Visual workflow designer                   │         │
│  │  - Intent mapping                             │         │
│  └────────────────────┬──────────────────────────┘         │
│                       │                                      │
│                       ▼                                      │
│  ┌───────────────────────────────────────────────┐         │
│  │  Integrations                                 │         │
│  │  - API calls to SAM backend (custom)          │         │
│  │  - Webhook to /api/shipments                  │         │
│  └────────────────────┬──────────────────────────┘         │
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │
                        ▼
                  SAM Backend
             (Limited integration)
```

**⚠️ CRITICAL LIMITATION:**

Seasalt.ai **does NOT use Claude (Anthropic)**. It uses their own NLP engine called "SeaWord".

**Impact:**
- ❌ Cannot reuse existing SAM conversational logic
- ❌ Need to rebuild conversation flows in their platform
- ❌ Different AI behavior than web interface
- ❌ Lose policy engine integration
- ❌ Higher cost ($0.15/min vs $0.09 or $0.013)

**Verdict:** **NOT RECOMMENDED** due to lack of Claude integration.

---

### **Option 3: Autocalls.ai**

```
┌─────────────────────────────────────────────────────────────┐
│                        CALLER                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                AUTOCALLS.AI PLATFORM                         │
│                                                              │
│  ┌───────────────────────────────────────────────┐         │
│  │  Phone Number (150+ countries)                │         │
│  └────────────────────┬──────────────────────────┘         │
│                       │                                      │
│                       ▼                                      │
│  ┌───────────────────────────────────────────────┐         │
│  │  Speech-to-Text (Built-in)                    │         │
│  │  - 100+ languages                             │         │
│  │  - Interruption handling                      │         │
│  └────────────────────┬──────────────────────────┘         │
│                       │                                      │
│                       ▼                                      │
│  ┌───────────────────────────────────────────────┐         │
│  │  Claude API Integration                       │         │
│  │  ✅ Uses YOUR Anthropic API Key               │         │
│  │  - System prompt configurable                 │         │
│  │  - Model: claude-sonnet-4-20250514            │         │
│  │  - Temperature, max_tokens control            │         │
│  └────────────────────┬──────────────────────────┘         │
│                       │                                      │
│                       ▼                                      │
│  ┌───────────────────────────────────────────────┐         │
│  │  Workflow Builder (No-code)                   │         │
│  │  - Visual drag & drop                         │         │
│  │  - Function calling setup                     │         │
│  │  - Conditional logic                          │         │
│  └────────────────────┬──────────────────────────┘         │
│                       │                                      │
│                       ▼                                      │
│  ┌───────────────────────────────────────────────┐         │
│  │  Actions / Integrations                       │         │
│  │  - HTTP requests to SAM APIs                  │         │
│  │  - 300+ pre-built integrations                │         │
│  │  - Custom webhooks                            │         │
│  └────────────────────┬──────────────────────────┘         │
│                       │                                      │
│                       ▼                                      │
│  ┌───────────────────────────────────────────────┐         │
│  │  Text-to-Speech (Built-in)                    │         │
│  │  - 300+ voices                                │         │
│  │  - Voice cloning option                       │         │
│  └────────────────────┬──────────────────────────┘         │
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │
                        ▼
                  Audio Stream
                        │
                        ▼
                  SAM Backend APIs
          (via HTTP/Webhook integration)
```

**Integration Approach:**

1. **Configure in Autocalls.ai Dashboard:**
   - Add Anthropic API key
   - Set system prompt (copy from `app/api/chat/route.ts`)
   - Select Arabic voice
   - Build workflow with visual builder

2. **Create SAM API Endpoints for Phone:**
   - `POST /api/phone/shipment-lookup`
   - `POST /api/phone/reschedule`
   - `POST /api/phone/update-address`
   - `POST /api/phone/update-instructions`

3. **Configure Functions in Autocalls.ai:**
   - Map Claude function calls to SAM APIs
   - Set up authentication (API key)
   - Configure response handling

4. **No Custom Code Required** on SAM side (just API endpoints)

---

## 📝 Implementation Plans

### **Plan A: Twilio + ConversationRelay**

**Timeline:** 3-4 hours
**Difficulty:** Medium (coding required)
**Cost:** $200-400 dev + $0.013/min ongoing

#### **Step-by-Step Implementation:**

**Phase 1: Setup (30 minutes)**

1. Create Twilio account
   ```bash
   https://www.twilio.com/try-twilio
   ```

2. Purchase Saudi phone number
   - Navigate to Phone Numbers → Buy a Number
   - Country: Saudi Arabia (+966)
   - Capabilities: Voice
   - Cost: ~$1-2/month

3. Get credentials
   - Account SID: `ACxxxxxxxxxxxxxxxxx`
   - Auth Token: `your-auth-token`

4. Add to `.env`:
   ```bash
   TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxx"
   TWILIO_AUTH_TOKEN="your-auth-token"
   TWILIO_PHONE_NUMBER="+966xxxxxxxxx"
   ```

5. Install dependencies:
   ```bash
   npm install twilio @twilio/voice-sdk
   ```

---

**Phase 2: Create Voice Webhook (1 hour)**

**File:** `app/api/voice/route.ts`

```typescript
// Handle incoming calls with TwiML
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // Get caller info
  const formData = await request.formData()
  const from = formData.get('From')
  const to = formData.get('To')

  // Generate TwiML response
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay
      url="wss://${process.env.NEXT_PUBLIC_BASE_URL}/api/voice/stream"
      voice="ar-SA-Standard-A"
      language="ar-SA"
      dtmfDetection="true"
    />
  </Connect>
</Response>`

  return new Response(twiml, {
    headers: {
      'Content-Type': 'text/xml',
      'Cache-Control': 'no-cache'
    }
  })
}
```

**Configure in Twilio Console:**
1. Go to Phone Numbers → Active Numbers
2. Select your number
3. Under "Voice & Fax":
   - A call comes in: **Webhook**
   - URL: `https://yourdomain.com/api/voice`
   - HTTP: **POST**
4. Save

---

**Phase 3: WebSocket Stream Handler (2 hours)**

**File:** `app/api/voice/stream/route.ts`

```typescript
import { Server } from 'ws'
import Anthropic from '@anthropic-ai/sdk'
import { handleConversation } from '@/lib/conversation-handler'

export async function GET(request: Request) {
  // Upgrade to WebSocket
  const upgrade = request.headers.get('upgrade')
  if (upgrade !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 })
  }

  // Create WebSocket server
  const wss = new Server({ noServer: true })

  wss.on('connection', (ws) => {
    let streamSid: string
    let callSid: string

    ws.on('message', async (message: string) => {
      const msg = JSON.parse(message)

      switch (msg.event) {
        case 'start':
          streamSid = msg.start.streamSid
          callSid = msg.start.callSid
          console.log(`Call started: ${callSid}`)
          break

        case 'media':
          // Audio from caller (base64 μ-law)
          const audio = msg.media.payload

          // Convert to text (STT)
          const text = await speechToText(audio)

          // Process with SAM conversation handler
          const response = await handleConversation({
            text,
            callSid,
            channel: 'phone'
          })

          // Convert to audio (TTS)
          const audioResponse = await textToSpeech(response)

          // Send back to Twilio
          ws.send(JSON.stringify({
            event: 'media',
            streamSid,
            media: {
              payload: audioResponse // base64 μ-law
            }
          }))
          break

        case 'stop':
          console.log(`Call ended: ${callSid}`)
          ws.close()
          break
      }
    })
  })

  return new Response(null, { status: 101 }) // Switching Protocols
}

async function speechToText(audioBase64: string): Promise<string> {
  // Use Twilio's built-in STT or Google Cloud Speech
  // Implementation details...
  return transcribedText
}

async function textToSpeech(text: string): Promise<string> {
  // Option A: Twilio built-in (simple)
  // Option B: ElevenLabs (same voice as web)

  const elevenlabs = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY
  })

  const audio = await elevenlabs.textToSpeech.convert(
    process.env.ELEVENLABS_VOICE_ID_AR,
    {
      text,
      modelId: 'eleven_multilingual_v2',
      voiceSettings: {
        stability: 0.5,
        similarityBoost: 0.75,
        style: 0,
        useSpeakerBoost: true,
        speed: 1.0
      }
    }
  )

  // Convert to μ-law base64 for Twilio
  return convertToMuLaw(audio)
}
```

---

**Phase 4: Shared Conversation Handler (1 hour)**

**File:** `lib/conversation-handler.ts`

```typescript
// Extract this from app/api/chat/route.ts
// Make it work for both web and phone

import Anthropic from '@anthropic-ai/sdk'
import { orchestrator } from './orchestrator'
import { evidenceLedger } from './evidence'
import { getActivePolicy } from './policy'

interface ConversationContext {
  text: string
  callSid?: string // For phone
  sessionId?: string // For web
  channel: 'web' | 'phone'
}

export async function handleConversation(
  ctx: ConversationContext
): Promise<string> {
  // Get active policy
  const policy = await getActivePolicy('prod')

  // Build system prompt
  const systemPrompt = buildSystemPrompt(policy)

  // Call Claude
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  })

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: policy.dials.conversational_mode.verbosity_budget_tokens,
    system: systemPrompt,
    messages: [
      { role: 'user', content: ctx.text }
    ],
    tools: [
      {
        name: 'lookup_shipment',
        description: 'Look up shipment by tracking number',
        input_schema: {
          type: 'object',
          properties: {
            tracking_number: { type: 'string' }
          }
        }
      },
      // ... other tools
    ]
  })

  // Handle tool calls
  if (response.stop_reason === 'tool_use') {
    const toolUse = response.content.find(c => c.type === 'tool_use')
    const result = await orchestrator.execute(toolUse)

    // Log to evidence ledger
    await evidenceLedger.log({
      channel: ctx.channel,
      sessionId: ctx.callSid || ctx.sessionId,
      action: toolUse.name,
      input: toolUse.input,
      output: result
    })

    // Return result as text
    return formatResponseText(result)
  }

  // Return Claude's text response
  return response.content[0].text
}
```

---

**Phase 5: Testing (30 minutes)**

1. **Local testing with ngrok:**
   ```bash
   ngrok http 3000
   ```

2. **Update Twilio webhook:**
   - Use ngrok URL: `https://abc123.ngrok.io/api/voice`

3. **Make test call:**
   - Call your Twilio number
   - Say: "أين شحنتي؟" (Where is my shipment?)
   - Say tracking number
   - Verify response

4. **Test scenarios:**
   - Shipment lookup
   - Reschedule delivery
   - Update address (with OTP)
   - Invalid tracking number
   - Interruptions

---

**Phase 6: Production Deployment**

1. Deploy to cPanel
2. Update Twilio webhook to production URL
3. Monitor first 50 calls
4. Analyze metrics:
   - Average call duration
   - Completion rate
   - Escalation rate
   - User satisfaction

---

### **Plan B: Autocalls.ai (No-Code)**

**Timeline:** < 30 minutes
**Difficulty:** Very Low (no coding)
**Cost:** $0.09/min

#### **Step-by-Step Implementation:**

**Step 1: Sign Up (5 minutes)**

1. Go to https://autocalls.ai
2. Create account
3. Verify email
4. Choose plan: Pay-as-you-go ($0.09/min)

---

**Step 2: Get Phone Number (5 minutes)**

1. In dashboard, go to **Phone Numbers**
2. Click **Buy Number**
3. Select:
   - Country: Saudi Arabia (+966)
   - City: Riyadh (or preferred)
   - Type: Local or Toll-free
4. Assign to agent (next step)

---

**Step 3: Connect Claude API (2 minutes)**

1. Go to **Integrations**
2. Click **Anthropic Claude**
3. Enter your API key: `process.env.ANTHROPIC_API_KEY`
4. Select model: `claude-sonnet-4-20250514`
5. Test connection
6. Save

---

**Step 4: Create Voice Agent (15 minutes)**

1. Go to **Voice Agents**
2. Click **Create New Agent**
3. Configure:

**Basic Settings:**
- Name: "SAM Delivery Assistant"
- Language: Arabic (ar-SA)
- Voice: Select Arabic voice (browse 300+ options)
- Greeting: "مرحباً، أنا سام، مساعد التوصيل. كيف يمكنني مساعدتك؟"

**AI Configuration:**
- Provider: Anthropic Claude ✅
- Model: claude-sonnet-4-20250514
- Temperature: 0.7
- Max tokens: 170 (from your policy: balanced mode)

**System Prompt:**
```
أنت "سام"، مساعد ذكي لخدمة عملاء شركة توصيل في السعودية.

مهامك:
1. البحث عن الشحنات برقم التتبع
2. إعادة جدولة التوصيل
3. تحديث عنوان التوصيل (يتطلب OTP)
4. تحديث تعليمات التوصيل

سياسات مهمة:
- لا تغير العنوان بدون رمز OTP
- لا تشارك معلومات شخصية (PII)
- سجل جميع الإجراءات في سجل الأدلة
- التزم بسياسة الشركة للتأكيدات

كن ودودًا ومهنيًا ومختصرًا.
```

**Functions (Tools):**
Click **Add Function** for each:

1. **lookup_shipment**
   - Name: `lookup_shipment`
   - Description: "Look up shipment by tracking number"
   - API Endpoint: `POST https://yourdomain.com/api/phone/shipment-lookup`
   - Headers: `Authorization: Bearer YOUR_API_KEY`
   - Parameters:
     ```json
     {
       "tracking_number": "string"
     }
     ```

2. **reschedule_delivery**
   - API Endpoint: `POST https://yourdomain.com/api/phone/reschedule`
   - Parameters:
     ```json
     {
       "tracking_number": "string",
       "new_date": "string",
       "new_time_slot": "string"
     }
     ```

3. **update_address**
   - API Endpoint: `POST https://yourdomain.com/api/phone/update-address`
   - Parameters:
     ```json
     {
       "tracking_number": "string",
       "new_address": "string",
       "otp_code": "string"
     }
     ```

4. **update_instructions**
   - API Endpoint: `POST https://yourdomain.com/api/phone/update-instructions`
   - Parameters:
     ```json
     {
       "tracking_number": "string",
       "instructions": "string"
     }
     ```

**Call Settings:**
- Max call duration: 10 minutes
- Silence timeout: 5 seconds
- Interruption handling: ✅ Enabled
- Voicemail detection: ✅ Enabled
- Call recording: ✅ Enabled (for compliance)

---

**Step 5: Create SAM Phone API Endpoints (Optional)**

If you want better integration, create these endpoints in SAM:

**File:** `app/api/phone/shipment-lookup/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { lookupShipment } from '@/lib/tool-servers/oms'

export async function POST(request: Request) {
  // Verify API key from Autocalls.ai
  const apiKey = request.headers.get('authorization')?.replace('Bearer ', '')
  if (apiKey !== process.env.PHONE_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { tracking_number } = await request.json()

  const shipment = await lookupShipment(tracking_number)

  return NextResponse.json({
    success: true,
    shipment: {
      tracking_number: shipment.tracking_number,
      status: shipment.status,
      eta: shipment.eta_ts,
      address: shipment.address_text_ar,
      current_location: shipment.current_location
    }
  })
}
```

Add to `.env`:
```bash
PHONE_API_KEY="your-random-secure-key-here"
```

---

**Step 6: Test Agent (5 minutes)**

1. In Autocalls dashboard, click **Test Call**
2. Enter your phone number
3. Receive test call
4. Test scenarios:
   - "أين شحنتي؟" → Provide tracking number
   - "أريد تغيير الموعد" → Reschedule flow
   - "تحديث العنوان" → OTP flow

---

**Step 7: Go Live (2 minutes)**

1. Switch agent status to **Active**
2. Assign phone number to agent
3. Done! ✅

**Monitor:**
- Go to **Analytics** dashboard
- View real-time calls
- Listen to recordings
- Review transcripts
- Check function call success rate

---

### **Plan C: Seasalt.ai**

**NOT RECOMMENDED** due to lack of Claude integration.

If you still want to evaluate:

1. Contact sales: https://seasalt.ai/en/
2. Request demo
3. Discuss pricing (starts at $0.15/min)
4. Evaluate if their NLP (SeaWord) can match Claude quality
5. Consider migration effort (rebuild conversation logic)

**Expected timeline:** 1-2 weeks (sales cycle + implementation)

---

## 🎯 Decision Matrix

### **Choose Twilio If:**

✅ You expect **> 500 calls/month**
✅ You want **lowest cost per minute**
✅ You need **full control** over code
✅ You want **same ElevenLabs voice** on phone as web
✅ You have **development resources** (3-4 hours)
✅ You want **deep integration** with SAM codebase

**ROI:** Pays for itself in 1-2 months at high volume

---

### **Choose Autocalls.ai If:**

✅ You want **fastest time to market** (< 30 min)
✅ You need to **test market demand** first
✅ You prefer **no-code** solution
✅ Call volume is **< 500/month**
✅ You want **300+ integrations** ready
✅ Development resources are **limited**

**ROI:** Immediate value, lower risk

---

### **Choose Seasalt.ai If:**

❌ **Not recommended** - does not use Claude

Only consider if:
- You want all-in-one omnichannel platform
- You're willing to abandon Claude
- You need HIPAA compliance
- Budget is not a concern ($0.15/min)

---

## 🚀 Recommended Approach: Phased Rollout

### **Phase 1: Proof of Concept (Week 1)**

**Platform:** Autocalls.ai
**Goal:** Test market demand
**Investment:** 30 minutes + $0.09/min

**Tasks:**
- [x] Sign up for Autocalls.ai
- [x] Get Saudi phone number
- [x] Connect Claude API
- [x] Configure voice agent
- [x] Test 10-20 calls
- [x] Gather feedback

**Success Criteria:**
- Agent understands Arabic queries
- Shipment lookup works
- Call quality is good
- Users prefer phone vs web (or vice versa)

**Decision Point:**
- If < 100 calls/month → **Stay with Autocalls.ai**
- If 100-500 calls/month → **Evaluate cost**
- If > 500 calls/month → **Migrate to Twilio**

---

### **Phase 2: Production Rollout (Week 2-4)**

**Scenario A: High Demand (> 500 calls/month)**

**Action:** Migrate to Twilio
- Investment: 3-4 hours development
- Savings: $200-300/month
- ROI: 1-2 months

**Scenario B: Medium Demand (100-500 calls/month)**

**Action:** Optimize Autocalls.ai
- Refine workflows
- Add more integrations
- Improve voice prompts
- Cost: $30-135/month

**Scenario C: Low Demand (< 100 calls/month)**

**Action:** Keep Autocalls.ai
- Cost: < $30/month
- No additional investment needed

---

### **Phase 3: Scale & Optimize (Month 2+)**

**High Volume Path (Twilio):**
- Add advanced features:
  - Call recording analytics
  - Sentiment analysis
  - A/B testing different prompts
  - Multi-language support (English fallback)
- Optimize costs:
  - Volume discounts with Twilio
  - Reduce average call duration
  - Improve self-service completion rate

**Medium/Low Volume Path (Autocalls.ai):**
- Enhance agent intelligence:
  - More complex workflows
  - Better context handling
  - Proactive callbacks
- Add integrations:
  - CRM (HubSpot, Salesforce)
  - WhatsApp notifications
  - Email follow-ups

---

## 📊 Risk Analysis

### **Twilio Risks:**

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Development delays | Medium | Medium | Allocate 4-6 hours buffer |
| WebSocket complexity | Low | High | Use official examples, test thoroughly |
| Cost overrun | Low | Low | Monitor usage, set alerts |
| Voice quality issues | Low | High | Test with multiple Arabic voices |
| Maintenance burden | Medium | Medium | Document well, modular code |

**Overall Risk:** **Low-Medium**

---

### **Autocalls.ai Risks:**

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Platform reliability | Low | High | Check uptime SLA, have fallback |
| Cost at scale | High | Medium | Set usage alerts, plan migration |
| Limited customization | High | Low | Design workflows carefully |
| Vendor lock-in | Medium | Medium | Keep APIs abstracted |
| Feature limitations | Medium | Medium | Test thoroughly in POC phase |

**Overall Risk:** **Low**

---

### **Seasalt.ai Risks:**

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| No Claude support | **Certain** | **Critical** | **Do not use** |
| High cost | High | High | Not applicable |
| Migration effort | High | High | Not applicable |
| Loss of SAM features | Certain | Critical | Not applicable |

**Overall Risk:** **Critical** - Not recommended

---

## 🔍 Competitive Analysis

### **How Maqsam Does It:**

Based on research:
- Uses traditional contact center platform (likely Seasalt.ai or similar)
- Custom IVR menus
- Live agent transfers
- Arabic AI with sentiment analysis

**SAM's Advantage with Autocalls.ai/Twilio:**
- ✅ More advanced AI (Claude vs generic NLP)
- ✅ Faster deployment
- ✅ More flexible (policy engine)
- ✅ Better cost structure
- ✅ Same AI on web + phone (consistency)

---

## 📚 Resources & Documentation

### **Official Documentation:**

**Twilio:**
- [Integrate Claude with Twilio Voice Using ConversationRelay](https://www.twilio.com/en-us/blog/integrate-anthropic-twilio-voice-using-conversationrelay)
- [Add Token Streaming and Interruption Handling](https://www.twilio.com/en-us/blog/anthropic-conversationrelay-token-streaming-interruptions-javascript)
- [Add Function Calling to Twilio Voice and Claude](https://www.twilio.com/en-us/blog/developers/tutorials/product/function-calling-twilio-voice-anthropic-claude-integration)
- [Twilio Media Streams Overview](https://www.twilio.com/docs/voice/media-streams)
- [Build an AI Voice Assistant with Twilio + OpenAI](https://www.twilio.com/en-us/blog/voice-ai-assistant-openai-realtime-api-node)

**Autocalls.ai:**
- [Autocalls.ai Homepage](https://autocalls.ai/)
- [Autocalls.ai Pricing](https://autocalls.ai/pricing)
- [AI Phone Call Integration with Anthropic Claude](https://autocalls.ai/integration/anthropic-claude)
- [Autocalls vs Vapi: 2025 Comparison](https://autocalls.ai/article/autocalls-vs-vapi-2025-comparison-pricing-features-ai-call-quality)

**Seasalt.ai:**
- [Seasalt.ai Homepage](https://seasalt.ai/en/)
- [Seasalt.ai Pricing Plans](https://wiki.seasalt.ai/seachat/seachat-payments/pricing-plans/)
- [About Seasalt.ai - Company Information](https://seasalt.ai/en/company/)

**Industry Comparisons:**
- [Real-Time Pricing Showdown: What 10k Minutes Cost](https://www.retellai.com/resources/voice-ai-platform-pricing-comparison-2025)
- [AI Voice Agent Pricing in 2025](https://www.videosdk.live/developer-hub/ai/ai-voice-agent-pricing)

---

## 💡 Key Takeaways

### **Summary:**

1. **Fastest Route:** Autocalls.ai (< 30 min setup, $0.09/min)
2. **Cheapest Route:** Twilio (3-4 hours dev, $0.013/min)
3. **Not Recommended:** Seasalt.ai (no Claude, $0.15/min)

### **Best Strategy:**

**Week 1:** Launch with Autocalls.ai
**Week 2-4:** Evaluate demand
**Month 2+:** Migrate to Twilio if volume > 500 calls/month

### **Critical Success Factors:**

- ✅ Use Claude (preserve SAM intelligence)
- ✅ Arabic voice quality
- ✅ Low latency (< 1 second)
- ✅ Same policies as web (OTP, PII, etc.)
- ✅ Evidence logging for compliance
- ✅ Cost management at scale

---

## 📞 Next Steps

### **To Proceed with Autocalls.ai:**

1. Review this document
2. Sign up: https://autocalls.ai
3. Follow "Plan B" implementation steps
4. Test with 10-20 calls
5. Gather feedback
6. Decide on next phase

### **To Proceed with Twilio:**

1. Review this document
2. Confirm 4-6 hours development time available
3. Create Twilio account
4. Follow "Plan A" implementation steps
5. Test locally with ngrok
6. Deploy to production

### **Questions to Answer:**

- [ ] Expected call volume (daily/monthly)?
- [ ] Budget for development (hours available)?
- [ ] Priority: Speed vs Cost?
- [ ] Voice quality requirements (must match ElevenLabs exactly)?
- [ ] Timeline for launch (days/weeks)?

---

**Document Version:** 1.0
**Last Updated:** December 31, 2025
**Author:** Claude (SAM Development Team)
**Status:** Ready for Review

---

**END OF DOCUMENT**
