import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  // Funnel counts
  const statusCounts = await prisma.conversation.groupBy({
    by: ['status'],
    _count: { id: true }
  });

  // Average actions per conversation
  const avgActions = await prisma.conversation.aggregate({
    _avg: { actionsTaken: true }
  });

  // Average time to resolution (resolved/closed only)
  // openedAt is always set (has default), so only filter on resolvedAt
  const resolvedConvos = await prisma.conversation.findMany({
    where: {
      resolvedAt: { not: null }
    },
    select: { openedAt: true, resolvedAt: true }
  });

  const avgResolutionMs = resolvedConvos.length > 0
    ? resolvedConvos.reduce((sum, c) => {
        return sum + (c.resolvedAt!.getTime() - c.openedAt.getTime());
      }, 0) / resolvedConvos.length
    : 0;

  // Reopen rate
  const totalClosed = await prisma.conversation.count({
    where: { status: { in: ['CLOSED', 'REOPENED'] } }
  });
  const reopened = await prisma.conversation.count({
    where: { status: 'REOPENED' }
  });
  const reopenRate = totalClosed > 0 ? (reopened / totalClosed) * 100 : 0;

  // Drop-off analysis: conversations that went ACTIVE but never RESOLVED
  const stuckActive = await prisma.conversation.count({
    where: {
      status: 'ACTIVE',
      lastMessageAt: { lt: new Date(Date.now() - 30 * 60 * 1000) } // 30+ min old
    }
  });

  // Conversations by hour (last 24h)
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentConvos = await prisma.conversation.findMany({
    where: { openedAt: { gte: last24h } },
    select: { openedAt: true, status: true }
  });

  return NextResponse.json({
    funnel: {
      open: statusCounts.find(s => s.status === 'OPEN')?._count.id || 0,
      active: statusCounts.find(s => s.status === 'ACTIVE')?._count.id || 0,
      resolved: statusCounts.find(s => s.status === 'RESOLVED')?._count.id || 0,
      closed: statusCounts.find(s => s.status === 'CLOSED')?._count.id || 0,
      reopened: statusCounts.find(s => s.status === 'REOPENED')?._count.id || 0,
    },
    metrics: {
      avgActionsPerConversation: avgActions._avg.actionsTaken || 0,
      avgResolutionTimeMinutes: Math.round(avgResolutionMs / 60000),
      reopenRatePercent: Math.round(reopenRate * 10) / 10,
      stuckActiveCount: stuckActive,
    },
    volume: {
      last24h: recentConvos.length
    }
  });
}
