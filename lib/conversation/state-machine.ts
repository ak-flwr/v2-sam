import { ConversationStatus } from '@prisma/client';

export type ConversationEvent =
  | 'MESSAGE_RECEIVED'
  | 'ACTION_COMPLETED'
  | 'CUSTOMER_SATISFIED'
  | 'CUSTOMER_GOODBYE'
  | 'CUSTOMER_NEW_REQUEST'
  | 'TIMEOUT_24H';

export interface StateTransition {
  from: ConversationStatus;
  event: ConversationEvent;
  to: ConversationStatus;
}

const transitions: StateTransition[] = [
  // Open -> Active (first message or action)
  { from: 'OPEN', event: 'MESSAGE_RECEIVED', to: 'ACTIVE' },
  { from: 'OPEN', event: 'ACTION_COMPLETED', to: 'ACTIVE' },

  // Active -> Resolved (customer says they're satisfied)
  { from: 'ACTIVE', event: 'CUSTOMER_SATISFIED', to: 'RESOLVED' },
  { from: 'ACTIVE', event: 'ACTION_COMPLETED', to: 'ACTIVE' }, // stays active

  // Resolved -> Closed (customer says goodbye)
  { from: 'RESOLVED', event: 'CUSTOMER_GOODBYE', to: 'CLOSED' },
  { from: 'RESOLVED', event: 'CUSTOMER_NEW_REQUEST', to: 'REOPENED' },
  { from: 'RESOLVED', event: 'TIMEOUT_24H', to: 'CLOSED' },

  // Reopened -> Active (back in action)
  { from: 'REOPENED', event: 'MESSAGE_RECEIVED', to: 'ACTIVE' },
  { from: 'REOPENED', event: 'ACTION_COMPLETED', to: 'ACTIVE' },

  // Closed can be reopened
  { from: 'CLOSED', event: 'CUSTOMER_NEW_REQUEST', to: 'REOPENED' },
];

export function getNextStatus(
  current: ConversationStatus,
  event: ConversationEvent
): ConversationStatus | null {
  const transition = transitions.find(t => t.from === current && t.event === event);
  return transition?.to ?? null;
}

export function canTransition(
  current: ConversationStatus,
  event: ConversationEvent
): boolean {
  return getNextStatus(current, event) !== null;
}
