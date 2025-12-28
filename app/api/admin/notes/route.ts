import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const resolved = searchParams.get('resolved')

    const where =
      resolved !== null
        ? { resolved: resolved === 'true' }
        : {}

    const notes = await prisma.shipmentNote.findMany({
      where,
      orderBy: { captured_at: 'desc' },
      include: {
        shipment: {
          select: {
            shipment_id: true,
            status: true,
          },
        },
      },
    })

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('Failed to fetch notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, resolved } = body

    const note = await prisma.shipmentNote.update({
      where: { id },
      data: { resolved },
    })

    return NextResponse.json({ note })
  } catch (error) {
    console.error('Failed to update note:', error)
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    )
  }
}
