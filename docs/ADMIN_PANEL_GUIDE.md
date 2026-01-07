# SAM v2 Admin Panel Architecture Guide

## Overview

The Admin Panel controls all aspects of SAM's behavior, from policy enforcement to conversation monitoring. Located at `/admin`, it provides real-time control over the AI agent.

**URL:** https://snd.aqel.ai/admin

---

## Tabs and Their Functions

### 1. Shipments Tab
- View all shipments in the system
- See status, ETA, risk level, location
- Test conversations with specific shipments

### 2. Notes Tab
- Customer notes attached to shipments
- Created by agent during conversations
- Shows timestamp, shipment ID, content

### 3. Ledger Tab
- Event log of all agent actions
- Tracks: reschedules, location updates, instruction changes
- Audit trail for compliance

### 4. Analytics Tab
- Conversation funnel: OPEN → ACTIVE → RESOLVED → CLOSED
- Resolution times, reopen rates
- Action counts and patterns

### 5. Conversations Tab
- Active and recent conversations
- Status, duration, actions taken
- Debug conversation flow

### 6. Policy Tab (Controls Agent Behavior)
- **This is where you control what the agent can/cannot do**
- See detailed section below

---

## Policy Engine Architecture

### How Policy Flows
```
Admin Panel (Policy Tab)
         |
         v
/api/admin/policy (PUT)
         |
         v
Database (PolicyConfig + Policy tables)
         |
         v
/api/chat reads policy on each request
         |
         v
Agent tools are enabled/disabled based on policy
```

### Two Policy Systems

#### 1. PolicyConfig (Simple Limits)
Location: `prisma/schema.prisma` - model PolicyConfig

| Field | Default | What It Controls |
|-------|---------|------------------|
| reschedule_cutoff_minutes | 120 | How far in advance delivery can be rescheduled |
| max_geo_move_meters | 250 | Maximum distance for location changes |
| trust_threshold_location | 0.8 | Confidence needed for location updates |
| max_content_multiplier | 0 | **Controls quantity changes (0 = disabled)** |

**To enable quantity changes:** Set `max_content_multiplier` to 2 (can double) or 3 (can triple)

#### 2. Policy Engine v2.1 (5 Dials)
Location: `lib/policy.ts`

| Dial | Range | Low (0) | High (100) |
|------|-------|---------|------------|
| Speech Pace | 0-100 | Slow (0.8x) | Fast (1.2x) |
| Conversational Mode | 0-100 | Concierge (detailed) | Transactional (brief) |
| Clarification Budget | 0-100 | Many questions (5) | Few questions (1) |
| Confirmation Rigor | 0-100 | Always confirm | Risk-based only |
| Autonomy Scope | 0-100 | Suggest only | Auto-act |

---

## Agent Tools and Policy Gates

### Available Tools

| Tool | What It Does | Policy Gate |
|------|--------------|-------------|
| reschedule_delivery | Change delivery date/time | reschedule_cutoff_minutes |
| update_location | Change delivery address | max_geo_move_meters |
| update_instructions | Add delivery notes | Always allowed |
| modify_content | Change order quantity | max_content_multiplier |

### How Policy Gates Work

When a user asks to change quantity:

1. User: "I want 3 items instead of 1"
2. Agent receives request
3. Agent checks `max_content_multiplier` from policy
4. If `max_content_multiplier = 0`: DENIED - "Policy doesn't allow quantity changes"
5. If `max_content_multiplier = 3`: ALLOWED - can increase up to 3x

---

## Your Specific Question: Quantity Changes

**Problem:** "Current policy doesn't allow quantity changes"

**Solution:** In Admin Panel → Policy Tab → Find `max_content_multiplier`

| Value | Meaning |
|-------|---------|
| 0 | Quantity changes DISABLED (current) |
| 1 | Can only keep same quantity |
| 2 | Can double quantity (1→2) |
| 3 | Can triple quantity (1→3) |
| 5 | Can increase up to 5x |

**To enable:** Set to desired maximum multiplier (e.g., 3)

---

## File Locations

| Component | File Path |
|-----------|-----------|
| Admin Panel UI | `/components/admin/AdminPanelV2.tsx` |
| Policy API | `/app/api/admin/policy/route.ts` |
| Policy Resolution | `/lib/policy.ts` |
| Chat (uses policy) | `/app/api/chat/route.ts` |
| Policy Schema | `/prisma/schema.prisma` |

---

## API Endpoints

### GET /api/admin/policy
Returns current policy configuration

### PUT /api/admin/policy
Updates policy configuration
```json
{
  "reschedule_cutoff_minutes": 120,
  "max_geo_move_meters": 250,
  "trust_threshold_location": 0.8,
  "max_content_multiplier": 3
}
```

### GET /api/policy?env=prod
Returns active Policy document for environment

### POST /api/policy
Creates/updates Policy document with dials

---

## Hard Floors (Never Bypassed)

Regardless of policy settings, these are ALWAYS enforced:

1. **OTP Verification** - Required for high-value actions
2. **PII Redaction** - Personal data never exposed
3. **Disallowed Actions** - These are NEVER allowed:
   - Order cancellation
   - Refunds
   - Identity changes
   - Payment modifications

---

## Quick Reference: Changing Agent Behavior

| Want to... | Change this setting |
|------------|---------------------|
| Allow quantity changes | max_content_multiplier → 2 or higher |
| Allow larger location moves | max_geo_move_meters → increase |
| Allow later reschedules | reschedule_cutoff_minutes → increase |
| Make agent more chatty | Conversational Mode dial → lower |
| Make agent faster/briefer | Conversational Mode dial → higher |
| Require more confirmations | Confirmation Rigor dial → lower |
| Let agent act autonomously | Autonomy Scope dial → higher |
