import { classifyPendingTicketViewCheckpoint } from "../../ticket-view/tier/pending-ticket-view-checkpoint-policy.js";
import { PendingTicketViewCheckpoint } from "../../ticket-view/tier/pending-ticket-view-checkpoint.js";
import { WeightedEscalationProposal, newWeightedEscalationProposal } from "./weighted-escalation-proposal.js";

export function summarizePendingTicketViewCheckpointsForProposal(items: PendingTicketViewCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveWeightedEscalationProposalsFromCheckpoint(items: PendingTicketViewCheckpoint[]): WeightedEscalationProposal[] {
  const out: WeightedEscalationProposal[] = [];
  for (const item of items) {
    const derived = newWeightedEscalationProposal(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitWeightedEscalationProposal(item: WeightedEscalationProposal): string {
  return classifyPendingTicketViewCheckpoint(item.adjustedExposure());
}
