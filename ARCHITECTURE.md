# DCL Resolution Engine - Backend Architecture

## Overview

The DCL Resolution Engine backend is built with **clean separation of concerns** and **swappable components** to enable seamless transition from Phase 0 (demo with mocks) to Phase 1 (production with real integrations).

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Layer (Next.js)                       │
│                     /app/api/actions/route.ts                    │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Orchestrator                             │
│               /lib/orchestrator/executeAction.ts                 │
│                                                                   │
│  Flow:                                                            │
│  1. Get shipment from OMS                                        │
│  2. Check route lock (Dispatch)                                  │
│  3. Normalize to domain model                                    │
│  4. Validate action format                                       │
│  5. Check policy                                                 │
│  6. Execute system writes                                        │
│  7. Write evidence packet                                        │
└──────┬──────────────┬────────────────┬──────────────┬───────────┘
       │              │                │              │
       ▼              ▼                ▼              ▼
┌────────────┐  ┌──────────┐   ┌─────────────┐  ┌──────────┐
│    OMS     │  │ Dispatch │   │   Policy    │  │ Evidence │
│   Client   │  │  Client  │   │   Engine    │  │  Ledger  │
└────────────┘  └──────────┘   └─────────────┘  └──────────┘
       │              │                │              │
       │              │                ▼              │
       │              │         ┌─────────────┐       │
       │              │         │   Domain    │       │
       │              │         │    Types    │       │
       │              │         └─────────────┘       │
       │              │                               │
       ▼              ▼                               ▼
┌────────────────────────────────────────────────────────────┐
│                        Database                             │
│                   (SQLite via Prisma)                       │
│                                                              │
│  Tables:                                                     │
│  - Shipment (shipment data)                                 │
│  - EvidencePacket (audit trail)                             │
│  - PolicyConfig (policy rules)                              │
│  - ShipmentNote (captured questions)                        │
└────────────────────────────────────────────────────────────┘
```

## Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Layer 1: Domain                          │
│                    Pure types, no dependencies                   │
│                                                                   │
│  /lib/domain/types.ts       - Core domain types                 │
│  /lib/domain/normalize.ts   - Normalization functions           │
│                                                                   │
│  Exports:                                                         │
│  - NormalizedShipment, Action, ActionResult                      │
│  - PolicyConfig, PolicyCheckResult                               │
│  - normalizeShipment(), calculateGeoDistance()                   │
└─────────────────────────────────────────────────────────────────┘
                                  ▲
                                  │ imports
┌─────────────────────────────────┴───────────────────────────────┐
│                      Layer 2: Policy Engine                      │
│                   Pure validation, imports domain/               │
│                                                                   │
│  /lib/policy/engine.ts      - Policy validation logic           │
│                                                                   │
│  Functions:                                                       │
│  - checkPolicy() - Validates action against rules               │
│  - validateAction() - Validates action format                    │
│                                                                   │
│  Rules:                                                           │
│  - Reschedule cutoff (120 min default)                          │
│  - Geo radius limit (250m default)                              │
│  - Route lock check                                              │
└─────────────────────────────────────────────────────────────────┘
                                  ▲
                                  │ imports
┌─────────────────────────────────┴───────────────────────────────┐
│                    Layer 3: Evidence Ledger                      │
│                  Audit trail, imports domain/                    │
│                                                                   │
│  /lib/evidence/ledger.ts    - Evidence operations               │
│                                                                   │
│  Functions:                                                       │
│  - writeEvidencePacket() - Create immutable record              │
│  - getEvidencePackets() - Retrieve audit trail                  │
│                                                                   │
│  Evidence Contains:                                               │
│  - Policy snapshot, before/after state                          │
│  - System write receipts, trust metadata                        │
│  - Timestamps (Phase 0) / Hash chain (Phase 1)                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Layer 4: Tool Servers                         │
│              Interface/Implementation separation                 │
│                                                                   │
│  OMS (Order Management):                                         │
│  /lib/tool-servers/oms/interface.ts  - OMSClient interface      │
│  /lib/tool-servers/oms/mock.ts       - Mock (Prisma)            │
│  /lib/tool-servers/oms/index.ts      - Factory                  │
│                                                                   │
│  Dispatch (Routing):                                             │
│  /lib/tool-servers/dispatch/interface.ts - DispatchClient       │
│  /lib/tool-servers/dispatch/mock.ts      - Mock                 │
│  /lib/tool-servers/dispatch/index.ts     - Factory              │
│                                                                   │
│  Phase 0: Returns mock implementations                           │
│  Phase 1: Returns real API clients                               │
└─────────────────────────────────────────────────────────────────┘
                                  ▲
                                  │ coordinates
┌─────────────────────────────────┴───────────────────────────────┐
│                     Layer 5: Orchestrator                        │
│              ONLY layer that touches tool servers                │
│                                                                   │
│  /lib/orchestrator/executeAction.ts                             │
│                                                                   │
│  Main Function:                                                   │
│  - executeAction(action, shipment_id)                           │
│                                                                   │
│  Coordinates:                                                     │
│  - OMS client (get/update shipment)                             │
│  - Dispatch client (check lock, update route)                   │
│  - Policy engine (validate action)                              │
│  - Evidence ledger (write audit trail)                          │
└─────────────────────────────────────────────────────────────────┘
```

## Dependency Rules

```
┌──────────────────────────────────────────────────────────────┐
│  STRICT DEPENDENCY RULES (enforced by architecture)           │
└──────────────────────────────────────────────────────────────┘

domain/          ← No dependencies (pure types)
  ↑
  │ imports
  │
policy/          ← Only imports domain/
  ↑
  │ imports
  │
evidence/        ← Only imports domain/

orchestrator/    ← Imports everything, coordinates tool-servers
  ↓
  │ uses
  │
tool-servers/    ← Interface-based, swappable implementations
```

## Action Flow Sequence

```
User Request
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Orchestrator receives action request                     │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Fetch shipment from OMS + check route lock (Dispatch)   │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Normalize to domain model (NormalizedShipment)          │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Validate action format (validateAction)                 │
│    - Check coordinates, dates, etc.                         │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Check policy (checkPolicy)                              │
│    - Reschedule cutoff (120 min)                           │
│    - Geo radius (250m)                                      │
│    - Route lock status                                      │
└────────────────────────────┬────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                  DENIED          ALLOWED
                    │                 │
                    ▼                 ▼
        ┌───────────────────┐  ┌─────────────────────┐
        │ Write evidence    │  │ Execute writes:     │
        │ (denial reason)   │  │ - OMS update        │
        │                   │  │ - Dispatch update   │
        │ Return failure    │  │ - Collect receipts  │
        └───────────────────┘  └──────────┬──────────┘
                                          │
                                          ▼
                            ┌─────────────────────────┐
                            │ Write evidence packet   │
                            │ (success + receipts)    │
                            │                         │
                            │ Return success +        │
                            │ evidence_id             │
                            └─────────────────────────┘
```

## File Structure

```
/lib/
├── index.ts                          # Main API surface
├── prisma.ts                         # Prisma client singleton
├── README.md                         # Architecture documentation
├── test-orchestrator.ts              # End-to-end test script
│
├── domain/                           # Pure domain layer
│   ├── types.ts                      # Core types
│   └── normalize.ts                  # Normalization functions
│
├── policy/                           # Policy engine
│   └── engine.ts                     # Validation logic
│
├── evidence/                         # Evidence ledger
│   └── ledger.ts                     # Audit trail operations
│
├── tool-servers/                     # Swappable implementations
│   ├── oms/
│   │   ├── interface.ts             # OMSClient interface
│   │   ├── mock.ts                  # Mock implementation
│   │   └── index.ts                 # Factory
│   └── dispatch/
│       ├── interface.ts             # DispatchClient interface
│       ├── mock.ts                  # Mock implementation
│       └── index.ts                 # Factory
│
└── orchestrator/                     # Orchestration layer
    └── executeAction.ts             # Main coordinator
```

## Key Design Decisions

### 1. Pure Domain Layer
- No external dependencies
- Easy to test in isolation
- Portable across environments

### 2. Interface-Based Tool Servers
- Clean separation of interface and implementation
- Factory pattern enables swapping Phase 0 → Phase 1
- Zero changes to business logic when swapping

### 3. Evidence-First Design
- Every action creates evidence (success or failure)
- Immutable audit trail
- Policy snapshot captured at execution time

### 4. Single Orchestrator
- Only one place that coordinates all systems
- Clear error handling boundaries
- Consistent evidence creation

### 5. Type Safety
- TypeScript strict mode
- All domain operations type-safe
- Compile-time validation of contracts

## Testing

Run the end-to-end test:

```bash
npx tsx lib/test-orchestrator.ts
```

This test:
1. Creates a test shipment
2. Executes all 3 action types
3. Tests policy denial scenarios
4. Verifies evidence packets created
5. Confirms database persistence
6. Cleans up test data

## Phase 0 vs Phase 1

| Aspect | Phase 0 (Demo) | Phase 1 (Production) |
|--------|----------------|----------------------|
| OMS | Mock (Prisma) | Real API integration |
| Dispatch | Mock (simple logic) | Real routing engine |
| Evidence | Timestamps only | Full hash-chaining |
| Trust | Demo PIN | Multi-factor auth |
| Database | SQLite | PostgreSQL/MySQL |

## Success Criteria

✅ **Architecture Quality:**
- Clean separation of concerns
- Pure domain layer (no dependencies)
- Policy engine only imports domain
- Evidence ledger only imports domain
- Tool servers have interface/implementation split
- Orchestrator is only layer touching tool servers

✅ **Functionality:**
- All 3 action types execute successfully
- Policy rules enforced correctly
- Evidence packets created for every action
- Changes persist in database
- Denial scenarios handled properly

✅ **Maintainability:**
- Clear dependency rules
- Easy to test each layer
- Swappable implementations
- Type-safe contracts
- Comprehensive documentation
