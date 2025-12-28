import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shipmentId = searchParams.get('shipment_id')

    const where = shipmentId ? { shipment_id: shipmentId } : {}

    const evidence = await prisma.evidencePacket.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        shipment: {
          select: {
            shipment_id: true,
            status: true,
          },
        },
      },
    })

    return NextResponse.json({ evidence })
  } catch (error) {
    console.error('Failed to fetch evidence:', error)
    return NextResponse.json(
      { error: 'Failed to fetch evidence' },
      { status: 500 }
    )
  }
}
