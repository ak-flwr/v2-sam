// Pure domain types - no external dependencies

export interface NormalizedShipment {
  shipment_id: string
  status: string
  eta: Date
  window: {
    start: Date
    end: Date
  }
  geo_pin: {
    lat: number
    lng: number
  }
  address: {
    text: string
    text_ar?: string
  }
  instructions?: string
  contact_phone_masked: string
  risk_tier: 'low' | 'medium' | 'high'
  route_locked: boolean
}

export interface TimeSlot {
  start: Date
  end: Date
  available: boolean
}

// Action types
export type ActionType = 'RESCHEDULE' | 'UPDATE_INSTRUCTIONS' | 'UPDATE_LOCATION'

export interface RescheduleAction {
  type: 'RESCHEDULE'
  new_window: {
    start: Date
    end: Date
  }
}

export interface UpdateInstructionsAction {
  type: 'UPDATE_INSTRUCTIONS'
  instructions: string
}

export interface UpdateLocationAction {
  type: 'UPDATE_LOCATION'
  geo_pin: {
    lat: number
    lng: number
  }
  address?: {
    text: string
    text_ar?: string
  }
}

export type Action = RescheduleAction | UpdateInstructionsAction | UpdateLocationAction

// Policy configuration
export interface PolicyConfig {
  reschedule_cutoff_minutes: number
  max_geo_move_meters: number
  trust_threshold_location: number
}

// Policy check result
export interface PolicyCheckResult {
  allowed: boolean
  denialReason?: string
  allowedActions: ActionType[]
  policySnapshot: PolicyConfig
}

// Action execution result
export interface ActionResult {
  success: boolean
  evidence_id?: string
  error?: string
  denialReason?: string
}

// System write receipt (for evidence)
export interface SystemWrite {
  system: 'OMS' | 'DISPATCH'
  operation: string
  timestamp: Date
  success: boolean
  error?: string
}
