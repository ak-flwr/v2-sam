/**
 * DCL Resolution Engine - Main API Surface
 *
 * This is the primary entry point for the DCL Resolution Engine backend.
 * It exports the key functions and types needed to execute actions.
 */

// Main orchestrator function - the only function you need to execute actions
export { executeAction } from './orchestrator/executeAction'

// Evidence ledger functions for audit trail
export {
  writeEvidencePacket,
  getEvidencePackets,
  getEvidencePacket,
} from './evidence/ledger'

// Policy engine functions for validation
export { checkPolicy, validateAction } from './policy/engine'

// Domain types - everything you need for type safety
export type {
  NormalizedShipment,
  Action,
  RescheduleAction,
  UpdateInstructionsAction,
  UpdateLocationAction,
  ActionType,
  ActionResult,
  PolicyConfig,
  PolicyCheckResult,
  SystemWrite,
  TimeSlot,
} from './domain/types'

// Tool server clients (for advanced usage)
export { omsClient, type OMSClient } from './tool-servers/oms'
export { dispatchClient, type DispatchClient } from './tool-servers/dispatch'

// Normalization utilities
export {
  normalizeShipment,
  calculateGeoDistance,
  minutesUntilETA,
} from './domain/normalize'

/**
 * Quick Start Example:
 *
 * ```typescript
 * import { executeAction } from '@/lib'
 *
 * const result = await executeAction(
 *   {
 *     type: 'UPDATE_INSTRUCTIONS',
 *     instructions: 'Leave with doorman'
 *   },
 *   'SHP-12345'
 * )
 *
 * if (result.success) {
 *   console.log('Success! Evidence:', result.evidence_id)
 * } else {
 *   console.log('Failed:', result.denialReason || result.error)
 * }
 * ```
 */
