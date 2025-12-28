import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const config = await prisma.policyConfig.findFirst()
    return NextResponse.json({ config })
  } catch (error) {
    console.error('Failed to fetch policy config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch policy config' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { reschedule_cutoff_minutes, max_geo_move_meters } = body

    const config = await prisma.policyConfig.findFirst()

    if (!config) {
      const newConfig = await prisma.policyConfig.create({
        data: {
          reschedule_cutoff_minutes,
          max_geo_move_meters,
        },
      })
      return NextResponse.json({ config: newConfig })
    }

    const updated = await prisma.policyConfig.update({
      where: { id: config.id },
      data: {
        reschedule_cutoff_minutes,
        max_geo_move_meters,
      },
    })

    return NextResponse.json({ config: updated })
  } catch (error) {
    console.error('Failed to update policy config:', error)
    return NextResponse.json(
      { error: 'Failed to update policy config' },
      { status: 500 }
    )
  }
}
