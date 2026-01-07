# SAM v2 - DCL Resolution Engine Architecture

Version: 2.3.3
Last Updated: 2026-01-07

## Overview

SAM v2 is an AI-powered delivery resolution system for last-mile logistics in Saudi Arabia. Task-resolution-first, not conversation-first.

Core Value Proposition:
- Converts customer intent + uncertainty into verified outcome
- Evidence-native: Every action produces immutable audit trail
- Policy-aware: Verification beats persuasion

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS, Framer Motion |
| AI/LLM | Claude API (Sonnet 4 + Haiku 3.5) with function calling |
| Voice | ElevenLabs Arabic TTS, Web Speech API (STT) |
| Database | PostgreSQL (Neon serverless) via Prisma ORM |
| Deployment | Vercel |
| Language | TypeScript (strict mode) |

## Directory Structure

lib/
  domain/           - Pure types, ZERO dependencies
  policy/           - Policy engine, imports domain only
  evidence/         - Audit ledger, imports domain only
  conversation/     - Conversation lifecycle state machine
  tool-servers/     - OMS + Dispatch (mock, swappable to real)
  orchestrator/     - Action execution, touches tool servers

## Conversation Lifecycle (v2.3.0+)

States: OPEN, ACTIVE, RESOLVED, CLOSED, REOPENED

Transitions:
- OPEN + message/action -> ACTIVE
- ACTIVE + customer_satisfied -> RESOLVED
- ACTIVE + customer_goodbye -> CLOSED (direct path)
- RESOLVED + goodbye -> CLOSED
- RESOLVED + new_request -> REOPENED
- CLOSED + new_request -> REOPENED
- REOPENED + message -> ACTIVE

Files:
- lib/conversation/state-machine.ts - Transition logic
- lib/conversation/service.ts - DB operations + intent detection

## Latency Optimizations (v2.3.1+)

| Optimization | Impact |
|--------------|--------|
| Parallel DB queries | -150ms |
| Haiku fast-path | -1.5s on simple queries |
| Split text/audio | -2s perceived latency |
| Claude streaming | Better UX |
| STT pre-warming | -300ms, no dropped words |

Fast-Path Detection:
- Greetings: alsalam, marhaba, hala
- Thanks/Goodbye: shukran, maa alsalama, bye
- Confirmations: ayeh, naam, tamam

Split Response Flow:
1. POST /api/chat?skipTTS=true -> Text in ~2.5s
2. POST /api/tts -> Audio in background ~1s
3. Frontend shows text immediately, plays audio when ready

## Multi-Action Handling (v2.3.2+)

When customer requests multiple actions:
1. Each tool pushes result to actionResults array
2. Response combines all successes and failures
3. Always ends with "hal tahtaj shay thani?"

Example:
- Input: "ghayir alkod wa daef alkamiya"
- Output: "tamam, hadatht alta3limat. siyasat alnizam ma tasmah..."

## STT Speech-to-Text (v2.3.3)

Pre-warming Strategy:
- Recognition object created on component mount
- Reused on each button press (no cold start)
- Visual: "Warming up..." then "Recording... Speak now"

Configuration:
- continuous: true
- interimResults: true
- lang: ar-SA

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/chat | POST | Main chat with TTS |
| /api/chat?skipTTS=true | POST | Text only (fast) |
| /api/tts | POST | Standalone TTS |
| /api/admin/shipments | GET | List shipments |
| /api/admin/conversations | GET | List conversations |
| /api/admin/analytics/conversations | GET | Funnel metrics |
| /api/seed | POST | Seed demo data |

## Database Models

| Model | Purpose |
|-------|---------|
| Shipment | Delivery data, status, ETA, geo, instructions |
| Conversation | Lifecycle state tracking |
| EvidencePacket | Immutable audit trail |
| ShipmentNote | Out-of-scope questions |
| PolicyConfig | Configurable business rules |
| Policy | Policy engine JSON documents |

## Claude Tools (Function Calling)

| Tool | Purpose |
|------|---------|
| reschedule_delivery | Change delivery time/date |
| update_instructions | Add/change delivery notes |
| update_location | Change delivery address |
| modify_content | Request quantity changes (human-in-loop) |
