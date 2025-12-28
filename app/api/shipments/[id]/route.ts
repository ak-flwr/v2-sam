import { NextRequest, NextResponse } from 'next/server'
import { omsClient } from '@/lib/tool-servers/oms'
import { normalizeShipment } from '@/lib/domain/normalize'
import { dispatchClient } from '@/lib/tool-servers/dispatch'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shipmentId } = await params

    // Get shipment from OMS
    const rawShipment = await omsClient.getShipment(shipmentId)

    // Check route lock status
    const routeLocked = await dispatchClient.isRouteLocked(shipmentId)

    // Normalize to domain model
    const normalized = normalizeShipment(rawShipment, routeLocked)

    // Return normalized shipment
    return NextResponse.json({
      shipment_id: normalized.shipment_id,
      status: normalized.status,
      eta: normalized.eta.toISOString(),
      window: {
        start: normalized.window.start.toISOString(),
        end: normalized.window.end.toISOString(),
      },
      address: normalized.address,
      geo_pin: normalized.geo_pin,
      instructions: normalized.instructions,
      route_locked: normalized.route_locked,
    })
  } catch (error) {
    console.error('Failed to get shipment:', error)
    return NextResponse.json(
      { error: 'Shipment not found' },
      { status: 404 }
    )
  }
}
