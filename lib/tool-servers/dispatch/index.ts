// Dispatch Client Factory
// Returns appropriate implementation based on environment
// Phase 0: Returns mock implementation
// Phase 1: Will return real Dispatch client

import type { DispatchClient } from './interface'
import { MockDispatchClient } from './mock'

/**
 * Creates and returns Dispatch client
 * In Phase 0, always returns mock
 * In Phase 1, will check environment and return real client if configured
 */
export function createDispatchClient(): DispatchClient {
  // Phase 0: Always use mock
  // Phase 1: Check for real Dispatch credentials and return real client if available
  const useRealDispatch = process.env.DISPATCH_API_URL && process.env.DISPATCH_API_KEY

  if (useRealDispatch) {
    // Phase 1: Import and return real Dispatch client
    throw new Error('Real Dispatch client not yet implemented - Phase 1')
  }

  // Phase 0: Return mock
  return new MockDispatchClient()
}

// Export singleton instance
export const dispatchClient = createDispatchClient()

// Re-export types for convenience
export type { DispatchClient, StopUpdate } from './interface'
