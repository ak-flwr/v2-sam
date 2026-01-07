export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper to detect language from text content
function detectLanguage(text: string): 'ar' | 'en' {
  if (!text) return 'ar' // Default to Arabic
  // Check if first meaningful character is Arabic (Unicode range 0600-06FF)
  const arabicRegex = /[\u0600-\u06FF]/
  const firstChars = text.trim().substring(0, 20)
  return arabicRegex.test(firstChars) ? 'ar' : 'en'
}

// Parse date range string to Date object
function getDateFromRange(range: string): Date {
  const now = new Date()
  switch (range) {
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    case '7d':
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d'
    const startDate = getDateFromRange(range)

    // Fetch all data in parallel for efficiency
    const [
      notes,
      evidencePackets,
      shipments,
      unresolvedCount
    ] = await Promise.all([
      // All notes in date range
      prisma.shipmentNote.findMany({
        where: {
          captured_at: { gte: startDate }
        },
        include: {
          shipment: {
            select: {
              risk_tier: true,
              status: true
            }
          }
        },
        orderBy: { captured_at: 'desc' }
      }),
      // All evidence packets in date range
      prisma.evidencePacket.findMany({
        where: {
          created_at: { gte: startDate }
        },
        orderBy: { created_at: 'desc' }
      }),
      // All shipments for reference
      prisma.shipment.findMany({
        select: {
          shipment_id: true,
          risk_tier: true,
          status: true
        }
      }),
      // Unresolved notes count
      prisma.shipmentNote.count({
        where: {
          resolved: false,
          note_type: { in: ['customer_question', 'out_of_scope'] }
        }
      })
    ])

    // === SUMMARY METRICS ===
    const totalInteractions = notes.length
    const totalActions = evidencePackets.length

    // Calculate success rate by comparing before_state and after_state
    const successfulActions = evidencePackets.filter(ep => {
      try {
        const before = JSON.parse(ep.before_state || '{}')
        const after = JSON.parse(ep.after_state || '{}')
        // If states are different, action was successful
        return JSON.stringify(before) !== JSON.stringify(after)
      } catch {
        return false
      }
    }).length

    const successRate = totalActions > 0
      ? Math.round((successfulActions / totalActions) * 100)
      : 100

    // === INTERACTIONS OVER TIME ===
    const interactionsByDate = new Map<string, number>()
    notes.forEach(note => {
      const date = note.captured_at.toISOString().split('T')[0]
      interactionsByDate.set(date, (interactionsByDate.get(date) || 0) + 1)
    })

    const interactionsOverTime = Array.from(interactionsByDate.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // === ACTIONS BY TYPE ===
    const actionTypeCounts = new Map<string, { total: number, success: number }>()
    evidencePackets.forEach(ep => {
      const type = ep.action_type
      const current = actionTypeCounts.get(type) || { total: 0, success: 0 }
      current.total++

      // Check if action succeeded
      try {
        const before = JSON.parse(ep.before_state || '{}')
        const after = JSON.parse(ep.after_state || '{}')
        if (JSON.stringify(before) !== JSON.stringify(after)) {
          current.success++
        }
      } catch {
        // Assume failure if parse fails
      }

      actionTypeCounts.set(type, current)
    })

    const actionsByType = Array.from(actionTypeCounts.entries())
      .map(([type, data]) => ({
        type,
        count: data.total,
        successCount: data.success
      }))

    // === NOTES BY TYPE ===
    const noteTypeCounts = new Map<string, number>()
    notes.forEach(note => {
      const type = note.note_type
      noteTypeCounts.set(type, (noteTypeCounts.get(type) || 0) + 1)
    })

    const notesByType = Array.from(noteTypeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)

    // === BY RISK TIER ===
    const riskTierCounts = new Map<string, number>()
    notes.forEach(note => {
      const tier = note.shipment?.risk_tier || 'unknown'
      riskTierCounts.set(tier, (riskTierCounts.get(tier) || 0) + 1)
    })

    const byRiskTier = Array.from(riskTierCounts.entries())
      .map(([tier, interactionCount]) => ({ tier, interactionCount }))

    // === TOP SHIPMENTS ===
    const shipmentNoteCounts = new Map<string, number>()
    notes.forEach(note => {
      shipmentNoteCounts.set(
        note.shipment_id,
        (shipmentNoteCounts.get(note.shipment_id) || 0) + 1
      )
    })

    const topShipments = Array.from(shipmentNoteCounts.entries())
      .map(([shipment_id, noteCount]) => ({ shipment_id, noteCount }))
      .sort((a, b) => b.noteCount - a.noteCount)
      .slice(0, 10)

    // === PEAK HOURS ===
    const hourCounts = new Array(24).fill(0)
    notes.forEach(note => {
      const hour = note.captured_at.getHours()
      hourCounts[hour]++
    })

    const peakHours = hourCounts.map((count, hour) => ({ hour, count }))

    // === LANGUAGE BREAKDOWN ===
    let arabicCount = 0
    let englishCount = 0
    notes.forEach(note => {
      if (detectLanguage(note.content) === 'ar') {
        arabicCount++
      } else {
        englishCount++
      }
    })

    return NextResponse.json({
      summary: {
        totalInteractions,
        totalActions,
        successRate,
        unresolvedCount
      },
      interactionsOverTime,
      actionsByType,
      notesByType,
      byRiskTier,
      topShipments,
      peakHours,
      languageBreakdown: {
        arabic: arabicCount,
        english: englishCount
      },
      dateRange: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
        range
      }
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
