import { weightedEscalationProposalBucket } from "../../escalation/budget/weighted-escalation-proposal-policy.js";
import { WeightedEscalationProposal } from "../../escalation/budget/weighted-escalation-proposal.js";
import { RollingSlaTier, newRollingSlaTier } from "./rolling-sla-tier.js";

export function summarizeWeightedEscalationProposalsForTier(items: WeightedEscalationProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveRollingSlaTiersFromProposal(items: WeightedEscalationProposal[]): RollingSlaTier[] {
  const out: RollingSlaTier[] = [];
  for (const item of items) {
    const derived = newRollingSlaTier(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveRollingSlaTier(item: RollingSlaTier): string {
  return weightedEscalationProposalBucket(item.projectedTotal());
}
