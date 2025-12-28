# Usage Guide - DCL Resolution Engine Backend

## Quick Start

The DCL Resolution Engine backend provides a single, simple API: `executeAction()`.

### Basic Usage

```typescript
import { executeAction } from '@/lib'

// Execute any action
const result = await executeAction(action, shipment_id)

if (result.success) {
  // Action succeeded
  console.log('Evidence ID:', result.evidence_id)
} else {
  // Action failed or was denied
  console.log('Error:', result.error || result.denialReason)
}
```

## Action Types

### 1. Update Instructions

Always allowed (lowest risk).

```typescript
const result = await executeAction(
  {
    type: 'UPDATE_INSTRUCTIONS',
    instructions: 'Leave with doorman on 3rd floor',
  },
  'SHP-12345'
)
```

**Arabic Support:**
```typescript
const result = await executeAction(
  {
    type: 'UPDATE_INSTRUCTIONS',
    instructions: 'اترك الطرد مع حارس البوابة في الطابق الثالث',
  },
  'SHP-12345'
)
```

### 2. Update Location

Allowed if:
- Route is not locked (driver not in motion)
- New location is within 250m of original (configurable)

```typescript
const result = await executeAction(
  {
    type: 'UPDATE_LOCATION',
    geo_pin: {
      lat: 24.7136,
      lng: 46.6753,
    },
    address: {
      text: 'Building 42, King Fahd Road, Riyadh',
      text_ar: 'مبنى ٤٢، طريق الملك فهد، الرياض',
    },
  },
  'SHP-12345'
)
```

**Location Only (no address change):**
```typescript
const result = await executeAction(
  {
    type: 'UPDATE_LOCATION',
    geo_pin: {
      lat: 24.7136,
      lng: 46.6753,
    },
  },
  'SHP-12345'
)
```

### 3. Reschedule

Allowed if:
- ETA is more than 120 minutes away (configurable)
- Route is not locked

```typescript
const result = await executeAction(
  {
    type: 'RESCHEDULE',
    new_window: {
      start: new Date('2024-01-15T14:00:00'),
      end: new Date('2024-01-15T16:00:00'),
    },
  },
  'SHP-12345'
)
```

## Next.js API Route Examples

### POST /api/actions/update-instructions

```typescript
// app/api/actions/update-instructions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { executeAction } from '@/lib'

export async function POST(request: NextRequest) {
  const { shipment_id, instructions } = await request.json()

  const result = await executeAction(
    {
      type: 'UPDATE_INSTRUCTIONS',
      instructions,
    },
    shipment_id
  )

  if (result.success) {
    return NextResponse.json({
      success: true,
      evidence_id: result.evidence_id,
      message: 'Instructions updated successfully',
    })
  } else {
    return NextResponse.json(
      {
        success: false,
        error: result.error || result.denialReason,
      },
      { status: 400 }
    )
  }
}
```

### POST /api/actions/update-location

```typescript
// app/api/actions/update-location/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { executeAction } from '@/lib'

export async function POST(request: NextRequest) {
  const { shipment_id, lat, lng, address, address_ar } = await request.json()

  const result = await executeAction(
    {
      type: 'UPDATE_LOCATION',
      geo_pin: { lat, lng },
      address: address
        ? {
            text: address,
            text_ar: address_ar,
          }
        : undefined,
    },
    shipment_id
  )

  if (result.success) {
    return NextResponse.json({
      success: true,
      evidence_id: result.evidence_id,
      message: 'Location updated successfully',
    })
  } else {
    return NextResponse.json(
      {
        success: false,
        error: result.error || result.denialReason,
      },
      { status: 400 }
    )
  }
}
```

### POST /api/actions/reschedule

```typescript
// app/api/actions/reschedule/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { executeAction } from '@/lib'

export async function POST(request: NextRequest) {
  const { shipment_id, window_start, window_end } = await request.json()

  const result = await executeAction(
    {
      type: 'RESCHEDULE',
      new_window: {
        start: new Date(window_start),
        end: new Date(window_end),
      },
    },
    shipment_id
  )

  if (result.success) {
    return NextResponse.json({
      success: true,
      evidence_id: result.evidence_id,
      message: 'Delivery rescheduled successfully',
    })
  } else {
    return NextResponse.json(
      {
        success: false,
        error: result.error || result.denialReason,
      },
      { status: 400 }
    )
  }
}
```

### Unified Action Endpoint

```typescript
// app/api/actions/execute/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { executeAction, type Action } from '@/lib'

export async function POST(request: NextRequest) {
  const { shipment_id, action } = await request.json()

  // Validate action type
  if (!['RESCHEDULE', 'UPDATE_INSTRUCTIONS', 'UPDATE_LOCATION'].includes(action.type)) {
    return NextResponse.json(
      { success: false, error: 'Invalid action type' },
      { status: 400 }
    )
  }

  // Execute action
  const result = await executeAction(action as Action, shipment_id)

  if (result.success) {
    return NextResponse.json({
      success: true,
      evidence_id: result.evidence_id,
      message: `${action.type} completed successfully`,
    })
  } else {
    return NextResponse.json(
      {
        success: false,
        error: result.error || result.denialReason,
      },
      { status: 400 }
    )
  }
}
```

## Viewing Evidence Trail

```typescript
// app/api/shipments/[id]/evidence/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getEvidencePackets } from '@/lib'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const shipment_id = params.id
  const evidencePackets = await getEvidencePackets(shipment_id)

  return NextResponse.json({
    shipment_id,
    evidence_count: evidencePackets.length,
    packets: evidencePackets.map((p) => ({
      evidence_id: p.evidence_id,
      action_type: p.action_type,
      created_at: p.created_at,
      trust_method: p.trust_method,
      trust_confidence: p.trust_confidence,
      system_writes: p.system_writes,
      // Include full state if needed
      before_state: p.before_state,
      after_state: p.after_state,
      requested_state: p.requested_state,
    })),
  })
}
```

## Advanced Usage

### Direct Policy Check (without execution)

```typescript
import { checkPolicy, validateAction, omsClient, dispatchClient, normalizeShipment } from '@/lib'

// Get shipment and check what actions are allowed
const rawShipment = await omsClient.getShipment('SHP-12345')
const routeLocked = await dispatchClient.isRouteLocked('SHP-12345')
const shipment = normalizeShipment(rawShipment, routeLocked)

// Get policy config
const policyConfig = {
  reschedule_cutoff_minutes: 120,
  max_geo_move_meters: 250,
  trust_threshold_location: 0.8,
}

// Check specific action
const action = {
  type: 'RESCHEDULE',
  new_window: {
    start: new Date('2024-01-15T14:00:00'),
    end: new Date('2024-01-15T16:00:00'),
  },
}

const policyCheck = checkPolicy(shipment, action, policyConfig)

if (policyCheck.allowed) {
  console.log('Action is allowed')
} else {
  console.log('Action denied:', policyCheck.denialReason)
  console.log('Allowed actions:', policyCheck.allowedActions)
}
```

### Get Available Time Slots

```typescript
import { dispatchClient } from '@/lib'

// Get available reschedule slots
const slots = await dispatchClient.getAvailableSlots('SHP-12345')

const availableSlots = slots.filter((s) => s.available)
console.log('Available slots:', availableSlots)
```

### Calculate Distance Before Update

```typescript
import { calculateGeoDistance } from '@/lib'

const originalLocation = { lat: 24.7136, lng: 46.6753 }
const newLocation = { lat: 24.7140, lng: 46.6757 }

const distanceMeters = calculateGeoDistance(originalLocation, newLocation)
console.log(`Distance: ${distanceMeters.toFixed(0)}m`)

if (distanceMeters <= 250) {
  console.log('Within policy limit')
} else {
  console.log('Exceeds policy limit')
}
```

## Error Handling

```typescript
import { executeAction } from '@/lib'

try {
  const result = await executeAction(action, shipment_id)

  if (result.success) {
    // Success path
    console.log('Action completed:', result.evidence_id)
  } else if (result.denialReason) {
    // Policy denial (expected)
    console.log('Action denied by policy:', result.denialReason)
    // Show user-friendly message
  } else if (result.error) {
    // Validation or system error
    console.log('Action failed:', result.error)
    // Show error to user
  }
} catch (error) {
  // Unexpected error (database down, etc.)
  console.error('System error:', error)
  // Show generic error to user
}
```

## Common Patterns

### Pre-flight Check Pattern

```typescript
// Check if action would be allowed before attempting
import { checkPolicy, validateAction, omsClient, dispatchClient, normalizeShipment } from '@/lib'

async function canExecuteAction(action, shipment_id) {
  // Get current state
  const rawShipment = await omsClient.getShipment(shipment_id)
  const routeLocked = await dispatchClient.isRouteLocked(shipment_id)
  const shipment = normalizeShipment(rawShipment, routeLocked)

  // Validate format
  const validationError = validateAction(shipment, action)
  if (validationError) {
    return { allowed: false, reason: validationError }
  }

  // Check policy
  const policyConfig = {
    reschedule_cutoff_minutes: 120,
    max_geo_move_meters: 250,
    trust_threshold_location: 0.8,
  }
  const policyCheck = checkPolicy(shipment, action, policyConfig)

  return {
    allowed: policyCheck.allowed,
    reason: policyCheck.denialReason,
    allowedActions: policyCheck.allowedActions,
  }
}

// Usage
const canReschedule = await canExecuteAction(rescheduleAction, 'SHP-12345')
if (canReschedule.allowed) {
  // Show reschedule UI
} else {
  // Show disabled state with reason
  console.log('Cannot reschedule:', canReschedule.reason)
}
```

### Batch Evidence Retrieval

```typescript
import { getEvidencePackets } from '@/lib'

// Get evidence for multiple shipments
async function getShipmentAuditTrails(shipment_ids: string[]) {
  const trails = await Promise.all(
    shipment_ids.map(async (id) => ({
      shipment_id: id,
      evidence: await getEvidencePackets(id),
    }))
  )
  return trails
}
```

## Testing

```bash
# Run end-to-end test
npx tsx lib/test-orchestrator.ts

# Expected output:
# 🚀 DCL Resolution Engine - Backend Architecture Test
# ✅ Test shipment created
# ✅ Instructions updated successfully
# ✅ Location updated successfully
# ✅ Reschedule successful
# ✅ Policy denial works correctly
# 📋 Found 4 evidence packets
# 🎉 All tests completed successfully!
```

## Configuration

Policy configuration is stored in the database (`PolicyConfig` table).

To update policy:

```typescript
import { prisma } from '@/lib/prisma'

// Create new policy configuration
await prisma.policyConfig.create({
  data: {
    reschedule_cutoff_minutes: 180, // 3 hours instead of 2
    max_geo_move_meters: 500, // 500m instead of 250m
    trust_threshold_location: 0.9, // Higher confidence required
  },
})

// Latest config will be used automatically
```

## Next Steps

1. **Create API routes** using the examples above
2. **Run the test script** to verify everything works
3. **Integrate with frontend** UI components
4. **Add authentication** to API routes
5. **Monitor evidence trail** for audit purposes

For architecture details, see [ARCHITECTURE.md](../ARCHITECTURE.md)
