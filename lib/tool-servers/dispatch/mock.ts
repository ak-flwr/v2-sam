// Mock Dispatch implementation
// Phase 0: Simulates dispatch system behavior
// Phase 1: This will be replaced with real Dispatch API calls

import { prisma } from '../../prisma'
import type { TimeSlot } from '../../domain/types'
import type { DispatchClient, StopUpdate } from './interface'

/**
 * Mock Dispatch Client Implementation
 * Simulates routing/dispatch system behavior for Phase 0
 */
export class MockDispatchClient implements DispatchClient {
  async getAvailableSlots(shipment_id: string): Promise<TimeSlot[]> {
    // Get shipment to base available slots on current window
    const shipment = await prisma.shipment.findUnique({
      where: { shipment_id },
    })

    if (!shipment) {
      throw new Error(`Shipment ${shipment_id} not found`)
    }

    // Generate mock available slots
    // In real system, this would query dispatch optimizer
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const slots: TimeSlot[] = []

    // Generate 4 time slots for tomorrow (9-11am, 11am-1pm, 1-3pm, 3-5pm)
    for (let i = 0; i < 4; i++) {
      const start = new Date(tomorrow)
      start.setHours(9 + i * 2, 0, 0, 0)
      const end = new Date(start)
      end.setHours(start.getHours() + 2)

      slots.push({
        start,
        end,
        available: true, // In real system, would check capacity
      })
    }

    return slots
  }

  async updateStop(shipment_id: string, updates: StopUpdate): Promise<void> {
    // In Phase 0, dispatch updates don't persist separately
    // They're handled by OMS updates
    // In Phase 1, this would call real dispatch API to update route

    // For now, just verify shipment exists
    const shipment = await prisma.shipment.findUnique({
      where: { shipment_id },
    })

    if (!shipment) {
      throw new Error(`Shipment ${shipment_id} not found in dispatch system`)
    }

    // Mock success - in real system would update routing engine
    return
  }

  async isRouteLocked(shipment_id: string): Promise<boolean> {
    // Phase 0 Demo: Always allow changes - route is never locked
    // In Phase 1, this would check driver location, route optimization status, etc.
    return false
  }
}
