import {
  batchedSubscriptionSummaryBucket,
} from "../../subscription/milestone/batched-subscription-summary-policy.js";
import { RollingSubscriptionSummary } from "../../subscription/milestone/rolling-subscription-summary.js";
import { PrimarySuppressionProposal, newPrimarySuppressionProposal } from "./primary-suppression-proposal.js";

export function summarizeRollingSubscriptionSummariesForProposal(items: RollingSubscriptionSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function derivePrimarySuppressionProposalsFromSummary(items: RollingSubscriptionSummary[]): PrimarySuppressionProposal[] {
  const out: PrimarySuppressionProposal[] = [];
  for (const item of items) {
    const derived = newPrimarySuppressionProposal(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function balancePrimarySuppressionProposal(item: PrimarySuppressionProposal): string {
  return batchedSubscriptionSummaryBucket(item.weightedValue());
}
