// Dispatch system client interface
// This interface allows for swappable implementations (mock vs real)

import type { TimeSlot } from '../../domain/types'

/**
 * Stop update data for dispatch system
 */
export interface StopUpdate {
  window?: { start: Date; end: Date }
  geo?: { lat: number; lng: number }
  address?: { text: string; text_ar?: string }
  instructions?: string
}

/**
 * Dispatch Client Interface
 * Defines all operations for interacting with the Dispatch/Routing System
 */
export interface DispatchClient {
  /**
   * Retrieves available delivery time slots for rescheduling
   * @param shipment_id - Unique shipment identifier
   * @returns Array of available time slots
   */
  getAvailableSlots(shipment_id: string): Promise<TimeSlot[]>

  /**
   * Updates a stop in the dispatch system
   * @param shipment_id - Unique shipment identifier
   * @param updates - Stop update data
   */
  updateStop(shipment_id: string, updates: StopUpdate): Promise<void>

  /**
   * Checks if route is locked (driver in motion, too close to delivery)
   * @param shipment_id - Unique shipment identifier
   * @returns True if route is locked
   */
  isRouteLocked(shipment_id: string): Promise<boolean>
}
