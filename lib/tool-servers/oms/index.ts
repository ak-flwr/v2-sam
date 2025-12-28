// OMS Client Factory
// Returns appropriate implementation based on environment
// Phase 0: Returns mock implementation
// Phase 1: Will return real OMS client

import type { OMSClient } from './interface'
import { MockOMSClient } from './mock'

/**
 * Creates and returns OMS client
 * In Phase 0, always returns mock
 * In Phase 1, will check environment and return real client if configured
 */
export function createOMSClient(): OMSClient {
  // Phase 0: Always use mock
  // Phase 1: Check for real OMS credentials and return real client if available
  const useRealOMS = process.env.OMS_API_URL && process.env.OMS_API_KEY

  if (useRealOMS) {
    // Phase 1: Import and return real OMS client
    throw new Error('Real OMS client not yet implemented - Phase 1')
  }

  // Phase 0: Return mock
  return new MockOMSClient()
}

// Export singleton instance
export const omsClient = createOMSClient()

// Re-export types for convenience
export type { OMSClient, RawShipmentData } from './interface'
