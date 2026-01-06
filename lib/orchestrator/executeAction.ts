// Action Orchestrator - The ONLY layer that touches tool servers
// Coordinates between OMS, Dispatch, Policy Engine, and Evidence Ledger

import type {
  Action,
  ActionResult,
  NormalizedShipment,
  SystemWrite,
  PolicyConfig,
} from '../domain/types'
import { normalizeShipment } from '../domain/normalize'
import { checkPolicy, validateAction } from '../policy/engine'
import { omsClient } from '../tool-servers/oms'
import { dispatchClient } from '../tool-servers/dispatch'
import { writeEvidencePacket } from '../evidence/ledger'
import { prisma } from '../prisma'

/**
 * Executes an action with full orchestration
 *
 * Flow:
 * 1. Get shipment from OMS
 * 2. Check route lock status from Dispatch
 * 3. Normalize to domain model
 * 4. Validate action format
 * 5. Check policy
 * 6. If allowed:
 *    - Execute writes to OMS + Dispatch
 *    - Collect system write receipts
 *    - Write evidence packet
 *    - Return success + evidence_id
 * 7. If denied:
 *    - Write evidence packet (with denial reason)
 *    - Return failure + reason
 *
 * @param action - The action to execute
 * @param shipment_id - Target shipment ID
 * @returns ActionResult with success status and evidence ID
 */
export async function executeAction(
  action: Action,
  shipment_id: string
): Promise<ActionResult> {
  const systemWrites: SystemWrite[] = []

  try {
    // Step 1: Get shipment from OMS
    const rawShipment = await omsClient.getShipment(shipment_id)

    // Step 2: Check route lock status from Dispatch
    const routeLocked = await dispatchClient.isRouteLocked(shipment_id)

    // Step 3: Normalize to domain model
    const shipment: NormalizedShipment = normalizeShipment(rawShipment, routeLocked)

    // Step 4: Get policy configuration
    const policyConfig = await getPolicyConfig()

    // Step 5: Validate action format
    const validationError = validateAction(shipment, action)
    if (validationError) {
      // Write evidence of validation failure
      const evidenceId = await writeEvidencePacket({
        shipment_id,
        action_type: action.type,
        trust_method: 'demo_pin',
        trust_confidence: 1.0,
        policy_snapshot: policyConfig,
        before_state: shipment,
        requested_state: action,
        system_writes: [],
        after_state: shipment,
      })

      return {
        success: false,
        error: validationError,
        evidence_id: evidenceId,
      }
    }

    // Step 6: Check policy
    const policyCheck = checkPolicy(shipment, action, policyConfig)

    if (!policyCheck.allowed) {
      // Write evidence of policy denial
      const evidenceId = await writeEvidencePacket({
        shipment_id,
        action_type: action.type,
        trust_method: 'demo_pin',
        trust_confidence: 1.0,
        policy_snapshot: policyConfig,
        before_state: shipment,
        requested_state: action,
        system_writes: [],
        after_state: shipment, // No changes
      })

      return {
        success: false,
        denialReason: policyCheck.denialReason,
        evidence_id: evidenceId,
      }
    }

    // Step 7: Execute action (policy allows it)
    await executeSystemWrites(action, shipment_id, systemWrites)

    // Step 8: Get updated shipment state for evidence
    const updatedRawShipment = await omsClient.getShipment(shipment_id)
    const updatedRouteLocked = await dispatchClient.isRouteLocked(shipment_id)
    const afterState = normalizeShipment(updatedRawShipment, updatedRouteLocked)

    // Step 9: Write evidence packet
    const evidenceId = await writeEvidencePacket({
      shipment_id,
      action_type: action.type,
      trust_method: 'demo_pin',
      trust_confidence: 1.0,
      policy_snapshot: policyConfig,
      before_state: shipment,
      requested_state: action,
      system_writes: systemWrites,
      after_state: afterState,
    })

    return {
      success: true,
      evidence_id: evidenceId,
    }
  } catch (error) {
    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Try to write evidence of error (best effort)
    try {
      const policyConfig = await getPolicyConfig()
      const evidenceId = await writeEvidencePacket({
        shipment_id,
        action_type: action.type,
        trust_method: 'demo_pin',
        trust_confidence: 1.0,
        policy_snapshot: policyConfig,
        before_state: {},
        requested_state: action,
        system_writes: systemWrites,
        after_state: {},
      })

      return {
        success: false,
        error: errorMessage,
        evidence_id: evidenceId,
      }
    } catch {
      // Evidence write failed - return error without evidence
      return {
        success: false,
        error: errorMessage,
      }
    }
  }
}

/**
 * Executes system writes based on action type
 * Collects receipts for evidence packet
 */
async function executeSystemWrites(
  action: Action,
  shipment_id: string,
  systemWrites: SystemWrite[]
): Promise<void> {
  switch (action.type) {
    case 'RESCHEDULE': {
      // Write to OMS
      try {
        await omsClient.updateWindow(shipment_id, action.new_window)
        systemWrites.push({
          system: 'OMS',
          operation: 'updateWindow',
          timestamp: new Date(),
          success: true,
        })
      } catch (error) {
        systemWrites.push({
          system: 'OMS',
          operation: 'updateWindow',
          timestamp: new Date(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        throw error
      }

      // Write to Dispatch
      try {
        await dispatchClient.updateStop(shipment_id, {
          window: action.new_window,
        })
        systemWrites.push({
          system: 'DISPATCH',
          operation: 'updateStop',
          timestamp: new Date(),
          success: true,
        })
      } catch (error) {
        systemWrites.push({
          system: 'DISPATCH',
          operation: 'updateStop',
          timestamp: new Date(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        throw error
      }
      break
    }

    case 'UPDATE_INSTRUCTIONS': {
      // Write to OMS only (dispatch doesn't need instruction updates)
      try {
        await omsClient.updateInstructions(shipment_id, action.instructions)
        systemWrites.push({
          system: 'OMS',
          operation: 'updateInstructions',
          timestamp: new Date(),
          success: true,
        })
      } catch (error) {
        systemWrites.push({
          system: 'OMS',
          operation: 'updateInstructions',
          timestamp: new Date(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        throw error
      }
      break
    }

    case 'UPDATE_LOCATION': {
      // Write to OMS
      try {
        await omsClient.updateLocation(
          shipment_id,
          action.geo_pin,
          action.address
        )
        systemWrites.push({
          system: 'OMS',
          operation: 'updateLocation',
          timestamp: new Date(),
          success: true,
        })
      } catch (error) {
        systemWrites.push({
          system: 'OMS',
          operation: 'updateLocation',
          timestamp: new Date(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        throw error
      }

      // Write to Dispatch
      try {
        await dispatchClient.updateStop(shipment_id, {
          geo: action.geo_pin,
          address: action.address,
        })
        systemWrites.push({
          system: 'DISPATCH',
          operation: 'updateStop',
          timestamp: new Date(),
          success: true,
        })
      } catch (error) {
        systemWrites.push({
          system: 'DISPATCH',
          operation: 'updateStop',
          timestamp: new Date(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        throw error
      }
      break
    }

    default: {
      throw new Error(`Unknown action type: ${(action as any).type}`)
    }
  }
}

/**
 * Gets current policy configuration from database
 * Creates default if none exists
 */
async function getPolicyConfig(): Promise<PolicyConfig> {
  // Get latest policy config
  const config = await prisma.policyConfig.findFirst({
    orderBy: { updated_at: 'desc' },
  })

  if (config) {
    return {
      reschedule_cutoff_minutes: config.reschedule_cutoff_minutes,
      max_geo_move_meters: config.max_geo_move_meters,
      trust_threshold_location: config.trust_threshold_location,
      max_content_multiplier: config.max_content_multiplier,
    }
  }

  // Create default config if none exists
  const defaultConfig = await prisma.policyConfig.create({
    data: {
      reschedule_cutoff_minutes: 120,
      max_geo_move_meters: 250,
      trust_threshold_location: 0.8,
      max_content_multiplier: 0,
    },
  })

  return {
    reschedule_cutoff_minutes: defaultConfig.reschedule_cutoff_minutes,
    max_geo_move_meters: defaultConfig.max_geo_move_meters,
    trust_threshold_location: defaultConfig.trust_threshold_location,
    max_content_multiplier: defaultConfig.max_content_multiplier,
  }
}
