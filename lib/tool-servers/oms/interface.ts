// OMS (Order Management System) client interface
// This interface allows for swappable implementations (mock vs real)

import type { Shipment } from '@prisma/client'

/**
 * Raw shipment data from OMS
 * In Phase 0, this is just the Prisma Shipment model
 * In Phase 1, this would be the actual OMS API response
 */
export type RawShipmentData = Shipment

/**
 * OMS Client Interface
 * Defines all operations for interacting with the Order Management System
 */
export interface OMSClient {
  /**
   * Retrieves shipment data from OMS
   * @param shipment_id - Unique shipment identifier
   * @returns Raw shipment data
   * @throws Error if shipment not found
   */
  getShipment(shipment_id: string): Promise<RawShipmentData>

  /**
   * Updates delivery window in OMS
   * @param shipment_id - Unique shipment identifier
   * @param window - New delivery window
   */
  updateWindow(
    shipment_id: string,
    window: { start: Date; end: Date }
  ): Promise<void>

  /**
   * Updates delivery instructions in OMS
   * @param shipment_id - Unique shipment identifier
   * @param instructions - New delivery instructions
   */
  updateInstructions(shipment_id: string, instructions: string): Promise<void>

  /**
   * Updates delivery location in OMS
   * @param shipment_id - Unique shipment identifier
   * @param geo - New geographic coordinates
   * @param address - Optional new address text
   */
  updateLocation(
    shipment_id: string,
    geo: { lat: number; lng: number },
    address?: { text: string; text_ar?: string }
  ): Promise<void>
}
