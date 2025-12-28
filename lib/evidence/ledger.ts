// Evidence Ledger - ONLY imports from /lib/domain/*
// NO dependencies on tool-servers

import { prisma } from '../prisma'
import type { SystemWrite } from '../domain/types'

/**
 * Evidence packet parameters
 */
export interface EvidencePacketParams {
  shipment_id: string
  action_type: string
  trust_method: string
  trust_confidence: number
  policy_snapshot: object
  before_state: object
  requested_state: object
  system_writes: SystemWrite[]
  after_state: object
}

/**
 * Writes an immutable evidence packet to the ledger
 * Creates cryptographic audit trail of all actions
 *
 * Phase 0: Stores timestamps only (no hash chaining)
 * Phase 1: Will implement full hash-chaining for tamper-evidence
 *
 * @param params - Evidence packet data
 * @returns evidence_id - Unique identifier for this evidence packet
 */
export async function writeEvidencePacket(
  params: EvidencePacketParams
): Promise<string> {
  // Serialize all JSON objects to strings
  const policySnapshot = JSON.stringify(params.policy_snapshot)
  const beforeState = JSON.stringify(params.before_state)
  const requestedState = JSON.stringify(params.requested_state)
  const systemWrites = JSON.stringify(params.system_writes)
  const afterState = JSON.stringify(params.after_state)

  // Phase 0: Skip hash chaining (will implement in Phase 1)
  // Phase 1: Get previous hash and compute self-hash
  const hashPrev = null
  const hashSelf = null

  // Write to database
  const evidencePacket = await prisma.evidencePacket.create({
    data: {
      shipment_id: params.shipment_id,
      action_type: params.action_type,
      trust_method: params.trust_method,
      trust_confidence: params.trust_confidence,
      policy_snapshot: policySnapshot,
      before_state: beforeState,
      requested_state: requestedState,
      system_writes: systemWrites,
      after_state: afterState,
      hash_prev: hashPrev,
      hash_self: hashSelf,
    },
  })

  return evidencePacket.evidence_id
}

/**
 * Retrieves evidence packets for a shipment
 * Used for audit trail viewing
 *
 * @param shipment_id - Shipment identifier
 * @returns Array of evidence packets
 */
export async function getEvidencePackets(shipment_id: string) {
  const packets = await prisma.evidencePacket.findMany({
    where: { shipment_id },
    orderBy: { created_at: 'asc' },
  })

  // Parse JSON strings back to objects for convenience
  return packets.map((p) => ({
    ...p,
    policy_snapshot: JSON.parse(p.policy_snapshot),
    before_state: JSON.parse(p.before_state),
    requested_state: JSON.parse(p.requested_state),
    system_writes: JSON.parse(p.system_writes),
    after_state: JSON.parse(p.after_state),
  }))
}

/**
 * Retrieves a single evidence packet by ID
 *
 * @param evidence_id - Evidence packet identifier
 * @returns Evidence packet or null
 */
export async function getEvidencePacket(evidence_id: string) {
  const packet = await prisma.evidencePacket.findUnique({
    where: { evidence_id },
  })

  if (!packet) {
    return null
  }

  // Parse JSON strings back to objects
  return {
    ...packet,
    policy_snapshot: JSON.parse(packet.policy_snapshot),
    before_state: JSON.parse(packet.before_state),
    requested_state: JSON.parse(packet.requested_state),
    system_writes: JSON.parse(packet.system_writes),
    after_state: JSON.parse(packet.after_state),
  }
}
