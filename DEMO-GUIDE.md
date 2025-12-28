# SAM v2 - Demo Testing Guide

**Live URLs:**
- **Production:** https://sam-v2.aqel.ai
- **Admin Panel:** https://sam-v2.aqel.ai/admin

---

## Pre-Demo Checklist

### 1. Seed the Production Database
**IMPORTANT:** Run this once before demo to populate database:

```bash
curl -X POST https://sam-v2.aqel.ai/api/seed
```

Expected response:
```json
{
  "success": true,
  "message": "Database seeded successfully",
  "shipmentsCreated": 5
}
```

If already seeded:
```json
{
  "message": "Database already seeded",
  "count": 5
}
```

### 2. Verify Admin Panel Access
1. Go to: https://sam-v2.aqel.ai/admin
2. Login with password: `admin123` or `demo`
3. Check all 4 tabs load correctly:
   - 📦 Shipments
   - 📋 Evidence Ledger
   - ⚙️ Policy Controls
   - 📝 Customer Notes

### 3. Browser Requirements
- **Chrome or Edge** (for Web Speech API voice recognition)
- **Allow microphone permissions** when prompted
- **HTTPS required** for voice features

---

## Demo Flow (Conversational)

### Setup
1. Open https://sam-v2.aqel.ai in Chrome/Edge
2. Allow microphone access
3. Have admin panel open in another tab: https://sam-v2.aqel.ai/admin

### Demo Script (Arabic-first)

**Note:** This is conversational, not scripted. The system should handle natural conversation flows.

#### 1. Welcome & Status Check
**You say:** "مرحبا، أريد معرفة حالة طردي" (Hello, I want to know my package status)

**Expected:** Agent responds in Arabic with current shipment details (SHP-2025-001)

---

#### 2. Reschedule Delivery (Success Case)
**You say:** "أريد تغيير وقت التسليم إلى الساعة 4 مساءً" (I want to change delivery time to 4 PM)

**Expected:**
- Agent asks for clarification or confirms
- Executes `reschedule_delivery` tool
- Shows success message: "✅ تم تحديث الموعد"
- Audio response in Arabic

**Verify in Admin:**
1. Switch to Admin Panel → Evidence Ledger tab
2. See new evidence packet with action_type: RESCHEDULE
3. Expand to see before/after state

---

#### 3. Update Delivery Instructions (Always Allowed)
**You say:** "اترك الطرد عند الباب" (Leave the package at the door)

**Expected:**
- Agent executes `update_instructions` tool
- Success message: "✅ تم تحديث الملاحظات"
- Evidence packet created

---

#### 4. Out-of-Scope Request (Graceful Handling)
**You say:** "What's the license plate of the delivery car?"

**Expected:**
- Agent responds politely: "I've noted your question for operations. Can I help with delivery timing or location?"
- Creates ShipmentNote in database

**Verify in Admin:**
1. Admin Panel → Customer Notes tab
2. See new note with content: "What's the license plate..."
3. Note type: `out_of_scope`
4. Can mark as resolved

---

#### 5. Update Location (Geocoding Demo)
**You say:** "Move delivery to King Fahd Road" or "انقل التسليم إلى طريق الملك فهد"

**Expected:**
- Agent geocodes "King Fahd Road, Riyadh"
- Executes `update_location` tool
- Success message: "✅ تم تحديث الموقع"
- Map coordinates update on UI

**Verify in Admin:**
1. Evidence Ledger → see UPDATE_LOCATION packet
2. Before state shows old coordinates
3. After state shows new coordinates (around 24.7136, 46.6753)

---

#### 6. Policy Denial - Geo Radius Exceeded
**You say:** "Move delivery to Jeddah" or "انقل التسليم إلى جدة"

**Expected:**
- Agent attempts to geocode Jeddah (~900km from Riyadh)
- Policy engine DENIES (exceeds 250m radius)
- Agent explains: "❌ الموقع الجديد بعيد جداً عن العنوان الأصلي (تجاوز 250 متر)"

**Verify in Admin:**
1. Evidence Ledger → see UPDATE_LOCATION packet
2. `system_writes` shows empty array (no writes executed)
3. `after_state` same as `before_state`
4. Evidence packet includes denial reason

---

#### 7. Policy Denial - Reschedule Cutoff
**Setup:** Choose shipment with ETA < 2 hours (e.g., SHP-2025-004)

**You say:** "أريد تغيير الموعد" (I want to reschedule)

**Expected:**
- Policy engine DENIES (within 120-minute cutoff window)
- Agent explains: "❌ لا يمكن إعادة الجدولة قبل 120 دقيقة من وقت الوصول"

---

## Admin Panel Demo

### Shipments Tab
1. Show all shipments in table
2. Filter by status: "Out for Delivery"
3. Show risk tiers (low/medium/high color coding)

### Evidence Ledger Tab
1. Show audit trail of all actions
2. Expand one packet to show:
   - Policy snapshot
   - Before state
   - After state
   - System writes (OMS + Dispatch receipts)

### Policy Controls Tab
1. Show current policy:
   - Reschedule cutoff: 120 minutes
   - Max geo radius: 250 meters
2. Adjust sliders:
   - Change cutoff to 180 minutes
   - Change radius to 500 meters
3. Save changes
4. Demonstrate that new policy applies to next action

### Customer Notes Tab
1. Show out-of-scope requests captured
2. Filter: Unresolved only
3. Mark a note as resolved
4. Show it moves to resolved list

---

## Architecture Demo Points

### Clean Tool Server Boundary
**Show in code:**
- `lib/policy/engine.ts` - ONLY imports from `domain/`
- `lib/evidence/ledger.ts` - ONLY imports from `domain/`
- `lib/orchestrator/executeAction.ts` - Coordinates tool servers

**Explain:**
> "Policy and evidence layers have ZERO dependencies on tool servers. In Phase 1, we swap `lib/tool-servers/oms/mock.ts` → `lib/tool-servers/oms/real.ts` and business logic stays unchanged."

### Evidence-First
**Show:**
- Every action (success OR failure) creates evidence packet
- Immutable audit trail with timestamps
- Policy snapshot captured at decision time

**Explain:**
> "Even denials create evidence. This proves we can audit 100% of customer interactions for compliance."

---

## Troubleshooting

### No Audio Playing
- Check microphone permissions
- Ensure HTTPS (required for Web Speech API)
- Try Chrome/Edge only

### Database Empty
- Run seed endpoint: `curl -X POST https://sam-v2.aqel.ai/api/seed`

### Geocoding Not Working
- Check Nominatim API availability (free tier may rate limit)
- Fallback: addresses in Riyadh should still work

### Voice Recognition Not Working
- Use Chrome/Edge (Safari doesn't support Web Speech API well)
- Speak clearly in Arabic or English
- Check microphone is not muted

---

## Success Criteria Checklist

### Demo Must Show:
- ✅ Web chat with Arabic voice responses
- ✅ 3 actions execute successfully (reschedule, instructions, location)
- ✅ Policy denial with clear reason (geo radius OR cutoff exceeded)
- ✅ Admin panel showing evidence ledger (audit trail)
- ✅ Out-of-scope requests captured gracefully
- ✅ Deployed at sam-v2.aqel.ai (whitelabeled)
- ✅ Stable for 60-minute demo window

### Architecture Must Prove:
- ✅ Clean tool server boundary (swappable)
- ✅ Evidence packet for 100% of actions
- ✅ Policy engine is pure (no tool-server dependencies)
- ✅ Changes persist in database (mocks write to DB)

---

## Post-Demo Notes

### What Works
- Full chat interface with Arabic TTS via ElevenLabs
- Voice recognition (Push-to-Talk) via Web Speech API
- 3 action types with policy validation
- Real geocoding via OpenStreetMap Nominatim
- Admin panel with 4 tabs
- Evidence ledger with JSON viewer
- Out-of-scope request capture
- Policy controls with live updates

### Phase 1 Readiness
**Swappable components:**
- `lib/tool-servers/oms/index.ts` - Factory switches mock → real
- `lib/tool-servers/dispatch/index.ts` - Factory switches mock → real

**No changes needed:**
- Policy engine (`lib/policy/engine.ts`)
- Evidence ledger (`lib/evidence/ledger.ts`)
- Domain types (`lib/domain/types.ts`)
- Orchestrator (`lib/orchestrator/executeAction.ts`)

---

## Quick Commands

```bash
# Seed database
curl -X POST https://sam-v2.aqel.ai/api/seed

# Get shipment details
curl https://sam-v2.aqel.ai/api/shipments/SHP-2025-001

# Get evidence ledger
curl https://sam-v2.aqel.ai/api/admin/evidence

# Get policy config
curl https://sam-v2.aqel.ai/api/admin/policy

# Get customer notes
curl https://sam-v2.aqel.ai/api/admin/notes
```

---

*Last updated: 2025-12-28*
*Demo ready for production deployment*
