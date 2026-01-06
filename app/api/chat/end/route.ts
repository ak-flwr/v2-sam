// app/api/chat/end/route.ts
// Endpoint to emit conversation.ended telemetry when a chat session concludes

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      conversation_id,
      shipment_id,
      policy_id,
      policy_version,
      outcome = 'resolved', // 'resolved' | 'handoff' | 'abandoned'
      escalation_count = 0,
      turns_total = 1,
      clarifiers_used = 0,
      confirm_turns = 0,
      actions_executed = 0,
      aht_seconds = 0,
    } = body

    if (!conversation_id) {
      return NextResponse.json({ error: 'conversation_id required' }, { status: 400 })
    }

    await prisma.telemetryEvent.create({
      data: {
        event: 'conversation.ended',
        environment: 'prod',
        conversation_id,
        case_key: shipment_id || null,
        policy_id: policy_id || null,
        policy_version: policy_version || null,
        payload: {
          outcome,
          escalation_count,
          metrics: {
            aht_seconds,
            turns_total,
            clarifiers_used,
            confirm_turns,
            actions_executed,
          },
        },
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to emit conversation.ended telemetry:', error)
    return NextResponse.json(
      { error: 'Failed to record conversation end' },
      { status: 500 }
    )
  }
}
