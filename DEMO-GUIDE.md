# SAM v2 Demo Guide

Version: 2.3.3
Last Updated: 2026-01-07

## Live URLs

- Production: https://sam-v2.aqel.ai
- Admin Panel: https://sam-v2.aqel.ai/admin
- Local Dev: http://localhost:3000

## Quick Start

1. Seed demo data:
   curl -X POST https://sam-v2.aqel.ai/api/seed

2. Open in Chrome/Edge (required for Web Speech API)

3. Admin login: admin123 or demo

## Test Scenarios

### 1. Basic Greeting
Say: "alsalam alaykum"
Expected: Arabic greeting response in ~2.5s (Haiku fast-path)

### 2. Shipment Status
Say: "wayn tardi" (where is my package)
Expected: Shipment details in Arabic

### 3. Update Instructions
Say: "ghayir alta3limat ila itasil qabl alwusul"
Expected: "tamam, hadatht alta3limat. hal tahtaj shay thani?"

### 4. Multi-Action Test
Say: "ghayir kod aldokhol ila 555 wa daef alkamiya"
Expected: Both outcomes reported:
- Code change: success
- Quantity: policy blocked
- Ends with: "hal tahtaj shay thani?"

### 5. Conversation Flow
1. Say: "alsalam alaykum" -> Greeting (OPEN to ACTIVE)
2. Say: "ghayir alta3limat" -> Action + follow-up
3. Say: "la shukran" -> Closes with goodbye (ACTIVE to CLOSED)

### 6. Policy Denial
Say: "inqil altawsil ila jeddah"
Expected: Denied (exceeds 250m radius), explained in Arabic

## Latency Targets

| Query Type | Target | Model |
|------------|--------|-------|
| Simple greeting | ~2.5s | Haiku |
| Action request | ~4-5s | Sonnet |
| Text appears | Before audio | Split response |

## Admin Panel Tabs

1. Shipments - View all with status/risk filtering
2. Evidence Ledger - Immutable audit trail
3. Policy Controls - Live sliders for cutoff/radius
4. Customer Notes - Out-of-scope questions
5. Conversations - Lifecycle status tracking
6. Analytics - Funnel visualization

## API Testing

Text only (fast):
curl -X POST "http://localhost:3000/api/chat?skipTTS=true" \
  -H "Content-Type: application/json" \
  -d '{"message":"marhaba","shipment_id":"SHP-2025-001"}'

With TTS:
curl -X POST "http://localhost:3000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"marhaba","shipment_id":"SHP-2025-001"}'

TTS only:
curl -X POST "http://localhost:3000/api/tts" \
  -H "Content-Type: application/json" \
  -d '{"text":"marhaba, kayf aqdur asaedak?"}'

## Troubleshooting

Mic not working:
- Check browser permissions (click lock icon)
- Must be Chrome/Edge
- Check Permissions-Policy header allows microphone

No shipments in dropdown:
- Database may be sleeping (Neon free tier)
- Hit any API endpoint to wake it
- Check /api/admin/shipments returns data

Slow responses:
- First request wakes Neon DB (~2-3s)
- Subsequent requests should be faster
- Simple queries use Haiku (faster)
