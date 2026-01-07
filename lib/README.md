# SAM v2 Backend Library

Version: 2.3.3

## Structure

lib/
  domain/        - Pure TypeScript types, no dependencies
  policy/        - Policy validation engine
  evidence/      - Immutable audit ledger
  conversation/  - Conversation lifecycle state machine
  orchestrator/  - Action execution coordinator
  tool-servers/  - OMS and Dispatch clients (mockable)
  prisma.ts      - Prisma client singleton

## Domain Layer

Pure types shared across all layers:
- Shipment, ShipmentStatus
- Action types, Policy types
- No runtime dependencies

## Policy Layer

Validates actions against business rules:
- Radius check for location updates (250m default)
- ETA check for reschedules (120min default)
- Route lock status

## Evidence Layer

Creates immutable audit trail:
- Every action (success or denial) logged
- Timestamps, trust factors, system writes
- Queryable for compliance

## Conversation Layer

State machine for conversation lifecycle:
- States: OPEN, ACTIVE, RESOLVED, CLOSED, REOPENED
- Tracks actions taken, timestamps
- Intent detection for Arabic/English

## Orchestrator

Coordinates action execution:
- Validates via Policy
- Executes via Tool Servers
- Records via Evidence

## Tool Servers

Mock implementations (swappable to real):
- OMS: getShipment, updateShipment
- Dispatch: isRouteLocked, updateRoute
