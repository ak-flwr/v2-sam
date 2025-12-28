// Pure policy engine - ONLY imports from /lib/domain/*
// NO dependencies on tool-servers or database

import type {
  NormalizedShipment,
  Action,
  ActionType,
  PolicyConfig,
  PolicyCheckResult,
} from '../domain/types'
import { calculateGeoDistance, minutesUntilETA } from '../domain/normalize'

/**
 * Pure policy check function
 * Validates whether an action is allowed based on policy rules
 *
 * Policy Rules:
 * 1. Reschedule: Only allowed if ETA > cutoff_minutes AND route not locked
 * 2. Geo update: Only allowed if distance <= max_geo_move_meters
 * 3. Trust gate: For Phase 0, assume trust is verified upstream (simplified)
 *
 * @param shipment - Normalized shipment data
 * @param action - Requested action
 * @param policyConfig - Policy configuration
 * @returns PolicyCheckResult with allowed/denied status and reasoning
 */
export function checkPolicy(
  shipment: NormalizedShipment,
  action: Action,
  policyConfig: PolicyConfig
): PolicyCheckResult {
  // Calculate allowed actions based on current state
  const allowedActions = getAllowedActions(shipment, policyConfig)

  // Check if the requested action is in the allowed list
  const actionAllowed = allowedActions.includes(action.type)

  // If not allowed, determine the specific denial reason
  let denialReason: string | undefined

  if (!actionAllowed) {
    denialReason = getDenialReason(shipment, action, policyConfig)
  }

  return {
    allowed: actionAllowed,
    denialReason,
    allowedActions,
    policySnapshot: policyConfig,
  }
}

/**
 * Determines which actions are currently allowed for this shipment
 */
function getAllowedActions(
  shipment: NormalizedShipment,
  policyConfig: PolicyConfig
): ActionType[] {
  const allowed: ActionType[] = []

  // Always allow instruction updates (lowest risk)
  allowed.push('UPDATE_INSTRUCTIONS')

  // Allow location updates if not locked
  if (!shipment.route_locked) {
    allowed.push('UPDATE_LOCATION')
  }

  // Allow reschedule only if:
  // 1. ETA is far enough in future (> cutoff)
  // 2. Route is not locked
  const minutesUntil = minutesUntilETA(shipment.eta)
  if (minutesUntil > policyConfig.reschedule_cutoff_minutes && !shipment.route_locked) {
    allowed.push('RESCHEDULE')
  }

  return allowed
}

/**
 * Provides specific denial reason for the action
 */
function getDenialReason(
  shipment: NormalizedShipment,
  action: Action,
  policyConfig: PolicyConfig
): string {
  switch (action.type) {
    case 'RESCHEDULE': {
      if (shipment.route_locked) {
        return 'Route is locked - driver already in motion'
      }
      const minutesUntil = minutesUntilETA(shipment.eta)
      if (minutesUntil <= policyConfig.reschedule_cutoff_minutes) {
        return `Reschedule cutoff exceeded. Need ${policyConfig.reschedule_cutoff_minutes} minutes, only ${minutesUntil} remaining`
      }
      return 'Reschedule not allowed'
    }

    case 'UPDATE_LOCATION': {
      if (shipment.route_locked) {
        return 'Route is locked - cannot update location'
      }

      // Check if geo distance exceeds policy limit
      const distance = calculateGeoDistance(shipment.geo_pin, action.geo_pin)
      if (distance > policyConfig.max_geo_move_meters) {
        return `Location change exceeds policy limit. Max: ${policyConfig.max_geo_move_meters}m, requested: ${Math.round(distance)}m`
      }

      return 'Location update not allowed'
    }

    case 'UPDATE_INSTRUCTIONS': {
      // Instructions should always be allowed, but just in case
      return 'Instruction update not allowed'
    }

    default:
      return 'Action not recognized'
  }
}

/**
 * Validates action-specific constraints beyond basic policy
 * Returns validation errors if any
 */
export function validateAction(
  shipment: NormalizedShipment,
  action: Action
): string | null {
  switch (action.type) {
    case 'RESCHEDULE': {
      // Validate window is in the future
      const now = new Date()
      if (action.new_window.start < now) {
        return 'Cannot reschedule to a time in the past'
      }
      // Validate window end is after start
      if (action.new_window.end <= action.new_window.start) {
        return 'Window end must be after window start'
      }
      return null
    }

    case 'UPDATE_LOCATION': {
      // Validate coordinates are valid
      if (
        action.geo_pin.lat < -90 ||
        action.geo_pin.lat > 90 ||
        action.geo_pin.lng < -180 ||
        action.geo_pin.lng > 180
      ) {
        return 'Invalid coordinates'
      }
      return null
    }

    case 'UPDATE_INSTRUCTIONS': {
      // Validate instructions are not empty
      if (!action.instructions || action.instructions.trim().length === 0) {
        return 'Instructions cannot be empty'
      }
      return null
    }

    default:
      return 'Unknown action type'
  }
}
