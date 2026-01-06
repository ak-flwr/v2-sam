import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where = status ? { status: status as any } : {}

    const conversations = await prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        shipment: {
          select: {
            shipment_id: true,
            status: true,
            address_text: true,
            address_text_ar: true,
          },
        },
      },
    })

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Failed to fetch conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}
