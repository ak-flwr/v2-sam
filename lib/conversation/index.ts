export { getNextStatus, canTransition, type ConversationEvent } from './state-machine';
export {
  getOrCreateConversation,
  transitionConversation,
  detectCustomerIntent,
  incrementActionsTaken,
  // TODO: Enable in Phase 1 for analytics dashboard
  // getDropOffAnalysis
} from './service';
