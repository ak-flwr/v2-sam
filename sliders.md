# v2.1 Policy Engine - 5 Dial System Overview

The Operations Dial System provides 5 sliders (0-100) that control agent behavior. Each dial uses **stepped bands** (not linear scaling) for safety and predictability.

---

## 1. Speech Pace (سرعة الكلام)
**Default: 50**

Controls TTS speed and agent utterance length.

| Range | Band | TTS Rate | Pause Trim | Max Utterance |
|-------|------|----------|------------|---------------|
| 0-20 | Relaxed | 0.95x | 0ms | 22s |
| 21-60 | Standard | 1.05x | 80ms | 20s |
| 61-85 | Brisk | 1.12x | 120ms | 16s |
| 86-100 | Rush | 1.18x | 150ms | 12s |

**Effect**: Higher = faster speech, shorter pauses, briefer responses.

---

## 2. Conversational Mode (نمط المحادثة)
**Default: 50**

Controls agent personality and verbosity.

| Range | Band | Profile | Verbosity Budget | Greeting Style |
|-------|------|---------|------------------|----------------|
| 0-33 | Concierge | `concierge` | 260 tokens | warm |
| 34-66 | Balanced | `balanced` | 170 tokens | polite |
| 67-100 | Transactional | `transactional` | 90 tokens | minimal |

**Effect**: Lower = warmer/more detailed; Higher = direct/efficient.

---

## 3. Clarification Budget (ميزانية التوضيح)
**Default: 50**

Controls how many clarifying questions the agent can ask.

| Range | Band | Max Questions | Proactive Confirm |
|-------|------|---------------|-------------------|
| 0-20 | Thorough | 5 | true |
| 21-50 | Normal | 3 | true |
| 51-75 | Efficient | 2 | false |
| 76-100 | Minimal | 1 | false |

**Effect**: Lower = more questions to ensure accuracy; Higher = fewer questions, faster resolution.

---

## 4. Confirmation Rigor (صرامة التأكيد)
**Default: 50**

Controls when the agent asks for confirmation before actions.

| Range | Band | Mode | Confirm High-Risk | Confirm Low-Risk |
|-------|------|------|-------------------|------------------|
| 0-33 | Strict | `always` | always | always |
| 34-79 | Risk-Based | `risk_based` | always | skip |
| 80-100 | Minimal | `minimal` | always | skip |

**Effect**: Lower = always confirm; Higher = only confirm high-risk actions.

---

## 5. Autonomy Scope (نطاق الاستقلالية)
**Default: 50**

Controls whether the agent can execute actions autonomously.

| Range | Band | Mode | Behavior |
|-------|------|------|----------|
| 0-33 | Suggest Only | `suggest_only` | Proposes solutions, waits for approval |
| 34-66 | Confirm+Act | `confirm_then_act` | Asks simple confirmation, then executes |
| 67-100 | Auto-Act | `auto_act` | Executes immediately when intent is clear |

**Effect**: Lower = human-in-the-loop; Higher = more autonomous execution.

---

## How They're Used in Chat

In `app/api/chat/route.ts`, the resolved values are injected into the system prompt:

```typescript
// Extract resolved policy values
const conversationalProfile = activePolicy?.dials.conversational_mode.profile ?? 'balanced'
const maxClarifiers = activePolicy?.dials.clarification_budget.max_clarifying_questions ?? 3
const autonomyMode = activePolicy?.dials.autonomy_scope.mode ?? 'confirm_then_act'

// Build Arabic style directives
const styleDirective = conversationalProfile === 'concierge'
  ? 'كن ودوداً ومفصلاً، استخدم عبارات ترحيب دافئة.'  // Be warm and detailed
  : conversationalProfile === 'transactional'
  ? 'كن موجزاً ومباشراً جداً. جملة أو اثنتين فقط.'    // Be very brief
  : 'كن ودوداً ولكن موجزاً. 1-2 جملة كحد أقصى.'      // Balanced
```

---

## Defaults Summary

| Dial | Default Value | Default Band | Default Behavior |
|------|---------------|--------------|------------------|
| Speech Pace | 50 | Standard | 1.05x TTS, 80ms pause trim, 20s max utterance |
| Conversational Mode | 50 | Balanced | Polite greeting, 170 token verbosity budget |
| Clarification Budget | 50 | Normal | Max 3 clarifying questions, proactive confirm enabled |
| Confirmation Rigor | 50 | Risk-Based | Confirm high-risk actions only |
| Autonomy Scope | 50 | Confirm+Act | Ask simple confirmation before executing actions |

---

## Guardrails (Non-Negotiable)

These safety features are **always enabled** regardless of dial settings:

- **PII Redaction**: Always on
- **OTP Required**: For sensitive actions (address changes, cancellations)
- **Compliance Block**: Hard block on policy violations
- **Audit Logging**: All actions logged to evidence ledger

---

## Logistics Limits

Separate from dials, these operational constraints are configured in the Policy tab:

| Setting | Default | Description |
|---------|---------|-------------|
| Reschedule Cutoff | 120 min | Customers cannot reschedule within this window before ETA |
| Max Location Move | 250 m | Location updates beyond this radius are denied |

---

## File Locations

| File | Purpose |
|------|---------|
| `lib/policy/types.ts` | TypeScript type definitions for all dials |
| `lib/policy/resolve.ts` | Band resolution logic (UI value → engine params) |
| `lib/policy/validate.ts` | Runtime validation of policy documents |
| `app/api/policy/route.ts` | GET/POST API for policy management |
| `components/admin/AdminPanelV2.tsx` | Admin UI with 5-dial sliders |
