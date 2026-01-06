// Pure normalization functions - converts Prisma models to domain types

import type { Shipment } from '@prisma/client'
import type { NormalizedShipment } from './types'

/**
 * Converts a Prisma Shipment model to the normalized domain model
 * @param shipment - Raw Prisma shipment object
 * @param route_locked - Whether the route is locked (from dispatch system)
 */
export function normalizeShipment(
  shipment: Shipment,
  route_locked: boolean = false
): NormalizedShipment {
  return {
    shipment_id: shipment.shipment_id,
    status: shipment.status,
    eta: shipment.eta_ts,
    window: {
      start: shipment.window_start,
      end: shipment.window_end,
    },
    geo_pin: {
      lat: shipment.geo_lat,
      lng: shipment.geo_lng,
    },
    address: {
      text: shipment.address_text,
      text_ar: shipment.address_text_ar || undefined,
    },
    package_content: shipment.package_content || undefined,
    instructions: shipment.instructions || undefined,
    contact_phone_masked: shipment.contact_phone_masked,
    risk_tier: shipment.risk_tier as 'low' | 'medium' | 'high',
    route_locked,
  }
}

/**
 * Helper to calculate distance between two geo points (Haversine formula)
 * Returns distance in meters
 */
export function calculateGeoDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (point1.lat * Math.PI) / 180
  const φ2 = (point2.lat * Math.PI) / 180
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

/**
 * Helper to calculate minutes until ETA
 */
export function minutesUntilETA(eta: Date): number {
  const now = new Date()
  const diffMs = eta.getTime() - now.getTime()
  return Math.floor(diffMs / 60000)
}
