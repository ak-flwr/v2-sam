# SAM v2 - Technology Overview

## System Summary

| Attribute | Value |
|-----------|-------|
| App Name | dcl-app (DCL Resolution Engine) |
| Version | 2.4.1 |
| Purpose | AI-powered delivery customer service (Arabic voice) |
| Production URL | https://snd.aqel.ai |
| Admin URL | https://snd.aqel.ai/admin |

---

## Runtime & Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 24.11.1 (local) / 20.x (Vercel) | JavaScript runtime |
| Next.js | 16.1.1 | Full-stack React framework |
| React | 19.2.3 | UI library |
| TypeScript | 5.9.3 | Type safety |

---

## Database

| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 15 | Primary database (hosted on Neon) |
| Prisma ORM | 7.2.0 | Database client & migrations |
| @prisma/adapter-neon | 7.2.0 | Serverless adapter for Neon |
| @neondatabase/serverless | 1.0.2 | HTTP-based database driver |

**Database Host:** Neon (eu-central-1)
**Connection:** HTTPS (serverless) - bypasses port 5432 restrictions

---

## AI & Voice

| Technology | Version | Purpose |
|------------|---------|---------|
| @anthropic-ai/sdk | 0.71.2 | Claude API client |
| Claude 3.5 Haiku | claude-3-5-haiku-20241022 | Fast responses (greetings, simple queries) |
| Claude 3.5 Sonnet | claude-sonnet-4-20250514 | Complex reasoning (actions, policy decisions) |
| ElevenLabs | 2.28.0 | Arabic text-to-speech |
| Web Speech API | Browser native | Arabic speech-to-text |

**Voice ID:** v0GSOyVKHcHq81326mCE (Saudi Arabic)
**STT Language:** ar-SA (Arabic - Saudi Arabia)

---

## UI & Styling

| Technology | Version | Purpose |
|------------|---------|---------|
| Tailwind CSS | 3.4.x | Utility-first styling |
| Framer Motion | 12.23.26 | Animations |
| Lucide React | 0.562.0 | Icons |

---

## Validation & Utilities

| Technology | Version | Purpose |
|------------|---------|---------|
| Zod | 4.2.1 | Schema validation |
| date-fns | - | Date formatting |

---

## Infrastructure

| Component | Provider | Details |
|-----------|----------|---------|
| Hosting | Vercel | Auto-deploy from GitHub |
| Database | Neon | Serverless PostgreSQL |
| Domain | Cloudflare/cPanel | DNS for aqel.ai |
| SSL | Vercel | Auto-provisioned |
| CDN | Vercel Edge | Global distribution |

---

## Project Structure

```
dcl-app/
├── app/                    # Next.js App Router
│   ├── admin/              # Admin panel page
│   ├── api/                # API routes (15 endpoints)
│   │   ├── admin/          # Admin APIs
│   │   │   ├── analytics/  # Conversation analytics
│   │   │   ├── conversations/
│   │   │   ├── evidence/
│   │   │   ├── notes/
│   │   │   ├── policy/
│   │   │   └── shipments/
│   │   ├── chat/           # Main conversation API
│   │   ├── policy/         # Policy resolution
│   │   ├── seed/           # Database seeding
│   │   ├── tts/            # Text-to-speech
│   │   └── telemetry/      # Usage tracking
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/
│   ├── admin/              # AdminPanelV2 (2,758 lines)
│   ├── policy-engine/      # Policy dial components
│   └── sam/                # Voice assistant UI
├── lib/
│   ├── prisma.ts           # Database client (lazy-loaded)
│   └── policy.ts           # Policy resolution engine
├── prisma/
│   └── schema.prisma       # Database schema
├── docs/                   # Documentation
├── scripts/                # Dev scripts
└── public/                 # Static assets
```

---

## Codebase Metrics

| Metric | Value |
|--------|-------|
| TypeScript files | 59 |
| Total lines of code | 8,732 |
| API routes | 15 |
| React components | 10+ |

---

## API Endpoints

### Public APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/chat | POST | Main conversation (STT → Claude → TTS) |
| /api/chat/end | POST | End conversation |
| /api/tts | POST | Text-to-speech conversion |
| /api/policy | GET/POST | Policy document management |

### Admin APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/admin/shipments | GET | List all shipments |
| /api/admin/conversations | GET | List conversations |
| /api/admin/analytics | GET | KPI metrics |
| /api/admin/analytics/conversations | GET | Conversation funnel |
| /api/admin/notes | GET/POST | Customer notes |
| /api/admin/evidence | GET | Evidence packets |
| /api/admin/policy | GET/PUT | Policy configuration |

### Utility APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/seed | POST | Seed demo data |
| /api/shipments/[id] | GET | Single shipment |
| /api/kpi | GET | KPI totals |
| /api/telemetry | POST | Usage logging |

---

## Database Schema

### Core Models

| Model | Purpose |
|-------|---------|
| Shipment | Delivery tracking |
| ShipmentNote | Customer notes |
| EvidencePacket | Proof of delivery |
| Conversation | Chat session tracking |
| PolicyConfig | Simple policy limits |
| Policy | Full policy documents |

### Conversation Lifecycle

```
OPEN → ACTIVE → RESOLVED → CLOSED
                    ↓
                REOPENED
```

---

## Security

### Headers (next.config.ts)

| Header | Value |
|--------|-------|
| Strict-Transport-Security | max-age=31536000; includeSubDomains |
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | origin-when-cross-origin |
| Permissions-Policy | microphone=self (for STT) |

### Policy Hard Floors

These are NEVER bypassed regardless of settings:
- OTP verification for high-value actions
- PII redaction
- Disallowed actions: cancel, refund, identity changes

---

## Performance Optimizations

| Optimization | Impact |
|--------------|--------|
| Haiku fast-path | 2.5s for simple queries (vs 5s) |
| Split text/audio response | -2s perceived latency |
| Parallel DB queries | -150ms |
| Continuous STT | Zero startup delay |
| 3-second STT buffer | Zero dropped words |

---

## Environment Variables

### Required (Production)

| Variable | Purpose |
|----------|---------|
| DATABASE_URL | Neon PostgreSQL connection |
| ANTHROPIC_API_KEY | Claude API |
| ELEVENLABS_API_KEY | TTS API |
| ELEVENLABS_VOICE_ID_AR | Arabic voice |

### Optional

| Variable | Purpose |
|----------|---------|
| NEXT_PUBLIC_BASE_URL | App URL |
| NODE_ENV | Environment mode |

---

## Development Commands

```bash
# Start development
./scripts/start-dev.sh

# Stop development
./scripts/stop-dev.sh

# Build for production
npm run build

# Deploy (auto via git push)
git push origin main

# Database operations
npx prisma generate    # Generate client
npx prisma db push     # Push schema changes
npx prisma studio      # GUI for database
```

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 2.4.1 | 2026-01-07 | Bulletproof STT (continuous listening) |
| 2.4.0 | 2026-01-07 | Vercel + Neon serverless deployment |
| 2.3.3 | 2026-01-06 | STT pre-warming, documentation |
| 2.3.2 | 2026-01-06 | Multi-action handling, Arabic errors |
| 2.3.1 | 2026-01-06 | 64% latency reduction |
| 2.3.0 | 2026-01-06 | Conversation lifecycle |

---

## External Services

| Service | Purpose | Dashboard |
|---------|---------|-----------|
| Vercel | Hosting | https://vercel.com/mts-projects-83a237ef/dcl-app |
| Neon | Database | https://console.neon.tech |
| Anthropic | AI | https://console.anthropic.com |
| ElevenLabs | TTS | https://elevenlabs.io |
| GitHub | Source | https://github.com/ak-flwr/v2-sam |
