import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where = status && status !== 'all' ? { status } : {}

    const shipments = await prisma.shipment.findMany({
      where,
      orderBy: { eta_ts: 'asc' },
    })

    return NextResponse.json({ shipments })
  } catch (error) {
    console.error('Failed to fetch shipments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shipments' },
      { status: 500 }
    )
  }
}
