import { prisma } from '@/lib/prisma';
import { ConversationStatus } from '@prisma/client';
import { getNextStatus, ConversationEvent } from './state-machine';

export async function getOrCreateConversation(shipmentId: string) {
  // Find existing open/active conversation
  let conversation = await prisma.conversation.findFirst({
    where: {
      shipmentId,
      status: { in: ['OPEN', 'ACTIVE', 'RESOLVED', 'REOPENED'] }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { shipmentId, status: 'OPEN' }
    });
  }

  return conversation;
}

export async function transitionConversation(
  conversationId: string,
  event: ConversationEvent
) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId }
  });

  if (!conversation) throw new Error('Conversation not found');

  const nextStatus = getNextStatus(conversation.status, event);
  if (!nextStatus) return conversation; // No valid transition

  const updateData: any = {
    status: nextStatus,
    lastMessageAt: new Date()
  };

  // Set timestamps based on new status
  if (nextStatus === 'RESOLVED') updateData.resolvedAt = new Date();
  if (nextStatus === 'CLOSED') updateData.closedAt = new Date();
  if (nextStatus === 'REOPENED') updateData.reopenedAt = new Date();
  if (event === 'ACTION_COMPLETED') {
    updateData.actionsTaken = { increment: 1 };
  }

  return prisma.conversation.update({
    where: { id: conversationId },
    data: updateData
  });
}

export async function detectCustomerIntent(message: string): Promise<ConversationEvent> {
  const lowerMsg = message.toLowerCase();
  const arabicMsg = message;

  // Goodbye signals
  const goodbyePatterns = [
    'bye', 'goodbye', 'thanks bye', 'شكرا', 'مع السلامة', 'باي', 'الله يعطيك العافية',
    'مشكور', 'يعطيك العافية', 'سلام'
  ];
  if (goodbyePatterns.some(p => arabicMsg.includes(p) || lowerMsg.includes(p))) {
    return 'CUSTOMER_GOODBYE';
  }

  // Satisfied signals (no more help needed)
  const satisfiedPatterns = [
    'no thanks', 'that\'s all', 'لا شكرا', 'لا ما احتاج', 'خلاص', 'تمام بس',
    'كذا تمام', 'لا بس كذا', 'ما احتاج شي'
  ];
  if (satisfiedPatterns.some(p => arabicMsg.includes(p) || lowerMsg.includes(p))) {
    return 'CUSTOMER_SATISFIED';
  }

  return 'MESSAGE_RECEIVED';
}

/**
 * Increment actions taken counter for a conversation.
 * Note: transitionConversation already increments this on ACTION_COMPLETED,
 * but this is kept for backward compatibility.
 */
export async function incrementActionsTaken(conversationId: string): Promise<void> {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      actionsTaken: { increment: 1 },
    },
  });
}

/**
 * Analyze where customers drop off in the conversation lifecycle.
 * Useful for identifying UX issues and improving containment rates.
 */
export async function getDropOffAnalysis() {
  const dropOffs = {
    // Started but never took action (stale for 1 hour)
    noAction: await prisma.conversation.count({
      where: {
        actionsTaken: 0,
        status: { in: ['CLOSED', 'ACTIVE'] },
        lastMessageAt: { lt: new Date(Date.now() - 60 * 60 * 1000) }
      }
    }),
    // Took action but never resolved (didn't say "no more help needed")
    actionButNoResolution: await prisma.conversation.count({
      where: {
        actionsTaken: { gt: 0 },
        resolvedAt: null,
        status: { not: 'ACTIVE' }
      }
    }),
    // Resolved but didn't close (didn't say goodbye, stale for 30 min)
    resolvedButNoClose: await prisma.conversation.count({
      where: {
        resolvedAt: { not: null },
        closedAt: null,
        status: 'RESOLVED',
        lastMessageAt: { lt: new Date(Date.now() - 30 * 60 * 1000) }
      }
    })
  };

  return dropOffs;
}

export type { ConversationEvent };
