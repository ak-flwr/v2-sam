// Mock OMS implementation using Prisma
// Phase 0: Writes to local database
// Phase 1: This will be replaced with real OMS API calls

import { prisma } from '../../prisma'
import type { OMSClient, RawShipmentData } from './interface'

/**
 * Mock OMS Client Implementation
 * Uses Prisma to persist changes to local database
 */
export class MockOMSClient implements OMSClient {
  async getShipment(shipment_id: string): Promise<RawShipmentData> {
    const shipment = await prisma.shipment.findUnique({
      where: { shipment_id },
    })

    if (!shipment) {
      throw new Error(`Shipment ${shipment_id} not found in OMS`)
    }

    return shipment
  }

  async updateWindow(
    shipment_id: string,
    window: { start: Date; end: Date }
  ): Promise<void> {
    await prisma.shipment.update({
      where: { shipment_id },
      data: {
        window_start: window.start,
        window_end: window.end,
      },
    })
  }

  async updateInstructions(
    shipment_id: string,
    instructions: string
  ): Promise<void> {
    await prisma.shipment.update({
      where: { shipment_id },
      data: {
        instructions,
      },
    })
  }

  async updateLocation(
    shipment_id: string,
    geo: { lat: number; lng: number },
    address?: { text: string; text_ar?: string }
  ): Promise<void> {
    const updateData: any = {
      geo_lat: geo.lat,
      geo_lng: geo.lng,
    }

    if (address) {
      updateData.address_text = address.text
      if (address.text_ar) {
        updateData.address_text_ar = address.text_ar
      }
    }

    await prisma.shipment.update({
      where: { shipment_id },
      data: updateData,
    })
  }
}
