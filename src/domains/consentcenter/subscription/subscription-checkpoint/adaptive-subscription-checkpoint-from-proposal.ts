import {
  classifyPrimarySuppressionProposal,
} from "../../suppression/batched-suppression-proposal/primary-suppression-proposal-policy.js";
import {
  PrimarySuppressionProposal,
} from "../../suppression/batched-suppression-proposal/primary-suppression-proposal.js";
import {
  AdaptiveSubscriptionCheckpoint,
  newAdaptiveSubscriptionCheckpoint,
} from "./adaptive-subscription-checkpoint.js";

export function summarizePrimarySuppressionProposalsForCheckpoint(items: PrimarySuppressionProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveAdaptiveSubscriptionCheckpointsFromProposal(items: PrimarySuppressionProposal[]): AdaptiveSubscriptionCheckpoint[] {
  const out: AdaptiveSubscriptionCheckpoint[] = [];
  for (const item of items) {
    const derived = newAdaptiveSubscriptionCheckpoint(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitAdaptiveSubscriptionCheckpoint(item: AdaptiveSubscriptionCheckpoint): string {
  return classifyPrimarySuppressionProposal(item.adjustedTotal());
}
