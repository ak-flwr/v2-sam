# DCL Resolution Engine - Backend Architecture

This directory contains the complete backend architecture for the DCL (Delivery Control Link) Resolution Engine with clean separation of concerns for Phase 1 readiness.

## Architecture Overview

```
/lib/
├── domain/           # Pure domain types and normalization (no dependencies)
├── policy/           # Pure policy engine (only imports from domain/)
├── evidence/         # Evidence ledger (only imports from domain/)
├── tool-servers/     # Swappable tool server implementations
└── orchestrator/     # Action orchestrator (only layer touching tool servers)
```

## Layer Responsibilities

### 1. Domain Layer (`/lib/domain/`)

Pure TypeScript types and normalization functions. **No external dependencies.**

**Files:**
- `types.ts` - Core domain types:
  - `NormalizedShipment` - Standardized shipment representation
  - `Action` types - `RescheduleAction`, `UpdateInstructionsAction`, `UpdateLocationAction`
  - `ActionResult` - Result of action execution
  - `PolicyCheckResult` - Result of policy validation
  - `SystemWrite` - Receipt of system write operations

- `normalize.ts` - Normalization functions:
  - `normalizeShipment()` - Converts Prisma model to domain model
  - `calculateGeoDistance()` - Haversine distance calculation
  - `minutesUntilETA()` - Time calculation helper

### 2. Policy Engine (`/lib/policy/`)

Pure policy validation logic. **Only imports from `/lib/domain/*`**.

**Files:**
- `engine.ts` - Policy validation:
  - `checkPolicy()` - Main policy check function
  - `validateAction()` - Action format validation

**Policy Rules:**
- **Reschedule cutoff:** Only allow if ETA > cutoff_minutes (default 120 min)
- **Geo radius:** Location updates must be ≤ max_geo_move_meters (default 250m)
- **Route lock:** No updates if route is locked (driver in motion)
- **Trust gate:** Demo PIN verification (simplified for Phase 0)

### 3. Tool Servers (`/lib/tool-servers/`)

Clean interface/implementation separation for Phase 1 swappability.

**OMS (Order Management System):**
- `oms/interface.ts` - `OMSClient` interface definition
- `oms/mock.ts` - Mock implementation using Prisma
- `oms/index.ts` - Factory returning appropriate implementation

**Operations:**
- `getShipment(id)` - Retrieve shipment data
- `updateWindow(id, window)` - Update delivery window
- `updateInstructions(id, instructions)` - Update delivery instructions
- `updateLocation(id, geo, address)` - Update delivery location

**Dispatch (Routing System):**
- `dispatch/interface.ts` - `DispatchClient` interface definition
- `dispatch/mock.ts` - Mock implementation
- `dispatch/index.ts` - Factory returning appropriate implementation

**Operations:**
- `getAvailableSlots(id)` - Get available reschedule slots
- `updateStop(id, updates)` - Update stop in routing system
- `isRouteLocked(id)` - Check if route is locked

### 4. Evidence Ledger (`/lib/evidence/`)

Immutable audit trail. **Only imports from `/lib/domain/*`**.

**Files:**
- `ledger.ts` - Evidence operations:
  - `writeEvidencePacket()` - Write immutable evidence record
  - `getEvidencePackets()` - Retrieve evidence for shipment
  - `getEvidencePacket()` - Retrieve single evidence packet

**Evidence Packet Contains:**
- Action metadata (type, trust method, confidence)
- Policy snapshot (rules at time of action)
- Before state (shipment before action)
- Requested state (what was requested)
- System writes (receipts from OMS/Dispatch)
- After state (shipment after action)
- Timestamps (Phase 0) / Hash chain (Phase 1)

### 5. Orchestrator (`/lib/orchestrator/`)

Action execution coordinator. **Only layer that touches tool servers.**

**Files:**
- `executeAction.ts` - Main orchestrator:
  - `executeAction()` - Executes action with full flow

**Execution Flow:**
1. Get shipment from OMS
2. Check route lock status from Dispatch
3. Normalize to domain model
4. Validate action format
5. Check policy
6. If allowed:
   - Execute writes to OMS + Dispatch
   - Collect system write receipts
   - Write evidence packet
   - Return success + evidence_id
7. If denied:
   - Write evidence packet (with denial reason)
   - Return failure + reason

## Usage Example

```typescript
import { executeAction } from '@/lib/orchestrator/executeAction'

// Reschedule action
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

if (result.success) {
  console.log('Action successful, evidence:', result.evidence_id)
} else {
  console.log('Action denied:', result.denialReason || result.error)
}

// Update instructions
const result2 = await executeAction(
  {
    type: 'UPDATE_INSTRUCTIONS',
    instructions: 'Leave with doorman',
  },
  'SHP-12345'
)

// Update location
const result3 = await executeAction(
  {
    type: 'UPDATE_LOCATION',
    geo_pin: { lat: 24.7136, lng: 46.6753 },
    address: {
      text: 'Building 42, Riyadh',
      text_ar: 'مبنى ٤٢، الرياض',
    },
  },
  'SHP-12345'
)
```

## Phase 0 vs Phase 1

### Phase 0 (Current - Demo Ready)
- Mock tool servers using Prisma
- Simple timestamp-based evidence
- Demo PIN trust verification
- All changes persist in local database

### Phase 1 (Production Ready)
- Real OMS/Dispatch API integrations
- Hash-chained evidence packets
- Multi-factor trust verification
- Real-time route optimization
- Proper error handling and retries

## Separation of Concerns

### Clean Boundaries

1. **Domain Layer** - Pure functions, no side effects
2. **Policy Engine** - Pure validation, no database access
3. **Evidence Ledger** - Only writes to database, no business logic
4. **Tool Servers** - Interface-based, easily swappable
5. **Orchestrator** - Coordinates all layers, handles side effects

### Dependency Rules

```
domain/          <- No dependencies
  ↑
policy/          <- Only imports domain/
  ↑
evidence/        <- Only imports domain/
  ↑
orchestrator/    <- Imports everything, coordinates tool-servers
```

### Why This Matters

- **Testability:** Each layer can be tested in isolation
- **Swappability:** Tool servers can be swapped without changing business logic
- **Auditability:** Evidence ledger is independent of implementation details
- **Maintainability:** Clear boundaries make changes predictable
- **Type Safety:** TypeScript ensures contracts are honored

## Success Criteria

✅ All files created with correct structure
✅ Policy engine only imports from `/lib/domain/*`
✅ Evidence ledger only imports from `/lib/domain/*`
✅ Tool servers have clean interface/implementation split
✅ Orchestrator successfully executes all 3 actions end-to-end
✅ Changes persist in database (via mocks)
✅ Evidence packets created for every action
