import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Check if data already exists
    const existingShipments = await prisma.shipment.count()
    if (existingShipments > 0) {
      return NextResponse.json({
        message: 'Database already seeded',
        count: existingShipments,
      })
    }

    // Create policy config first
    await prisma.policyConfig.create({
      data: {
        reschedule_cutoff_minutes: 120,
        max_geo_move_meters: 250,
        trust_threshold_location: 0.8,
      },
    })

    // Seed 5 demo shipments in Riyadh
    const now = new Date()
    const shipments = [
      {
        shipment_id: 'SHP-2025-001',
        status: 'OUT_FOR_DELIVERY',
        eta_ts: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
        window_start: new Date(now.getTime() + 1.5 * 60 * 60 * 1000),
        window_end: new Date(now.getTime() + 3 * 60 * 60 * 1000),
        address_text: 'King Fahd Road, Olaya District, Riyadh',
        address_text_ar: 'طريق الملك فهد، حي العليا، الرياض',
        geo_lat: 24.7136,
        geo_lng: 46.6753,
        instructions: 'Call upon arrival',
        contact_phone_masked: '+966-5X-XXX-1234',
        risk_tier: 'low',
      },
      {
        shipment_id: 'SHP-2025-002',
        status: 'OUT_FOR_DELIVERY',
        eta_ts: new Date(now.getTime() + 4 * 60 * 60 * 1000),
        window_start: new Date(now.getTime() + 3.5 * 60 * 60 * 1000),
        window_end: new Date(now.getTime() + 5 * 60 * 60 * 1000),
        address_text: 'Al Tahlia Street, Al Muhammadiyah, Riyadh',
        address_text_ar: 'شارع التحلية، المحمدية، الرياض',
        geo_lat: 24.7244,
        geo_lng: 46.6695,
        instructions: 'Leave at reception',
        contact_phone_masked: '+966-5X-XXX-5678',
        risk_tier: 'medium',
      },
      {
        shipment_id: 'SHP-2025-003',
        status: 'PENDING',
        eta_ts: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
        window_start: new Date(now.getTime() + 23 * 60 * 60 * 1000),
        window_end: new Date(now.getTime() + 26 * 60 * 60 * 1000),
        address_text: 'King Abdullah Road, Al Malqa, Riyadh',
        address_text_ar: 'طريق الملك عبدالله، الملقا، الرياض',
        geo_lat: 24.7753,
        geo_lng: 46.6372,
        instructions: 'Security gate - provide ID',
        contact_phone_masked: '+966-5X-XXX-9012',
        risk_tier: 'high',
      },
      {
        shipment_id: 'SHP-2025-004',
        status: 'OUT_FOR_DELIVERY',
        eta_ts: new Date(now.getTime() + 1 * 60 * 60 * 1000), // 1 hour
        window_start: new Date(now.getTime() + 0.5 * 60 * 60 * 1000),
        window_end: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        address_text: 'Prince Mohammed Bin Salman Road, Hittin, Riyadh',
        address_text_ar: 'طريق الأمير محمد بن سلمان، حطين، الرياض',
        geo_lat: 24.7659,
        geo_lng: 46.6189,
        instructions: 'Ring doorbell twice',
        contact_phone_masked: '+966-5X-XXX-3456',
        risk_tier: 'low',
      },
      {
        shipment_id: 'SHP-2025-005',
        status: 'OUT_FOR_DELIVERY',
        eta_ts: new Date(now.getTime() + 6 * 60 * 60 * 1000),
        window_start: new Date(now.getTime() + 5.5 * 60 * 60 * 1000),
        window_end: new Date(now.getTime() + 7 * 60 * 60 * 1000),
        address_text: 'Makkah Road, Al Aziziyah, Riyadh',
        address_text_ar: 'طريق مكة، العزيزية، الرياض',
        geo_lat: 24.6889,
        geo_lng: 46.7219,
        instructions: 'Building 12, 3rd floor',
        contact_phone_masked: '+966-5X-XXX-7890',
        risk_tier: 'medium',
      },
    ]

    for (const shipmentData of shipments) {
      await prisma.shipment.create({ data: shipmentData })
    }

    const count = await prisma.shipment.count()

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      shipmentsCreated: count,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Failed to seed database', details: String(error) },
      { status: 500 }
    )
  }
}
