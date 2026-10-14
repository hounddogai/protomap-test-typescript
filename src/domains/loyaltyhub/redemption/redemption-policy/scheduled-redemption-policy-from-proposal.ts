import { lenientLevelProposalBucket } from "../../level/quota/lenient-level-proposal-policy.js";
import { LenientLevelProposal } from "../../level/quota/lenient-level-proposal.js";
import { ScheduledRedemptionPolicy, newScheduledRedemptionPolicy } from "./scheduled-redemption-policy.js";

export function summarizeLenientLevelProposalsForPolicy(items: LenientLevelProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveScheduledRedemptionPoliciesFromProposal(items: LenientLevelProposal[]): ScheduledRedemptionPolicy[] {
  const out: ScheduledRedemptionPolicy[] = [];
  for (const item of items) {
    const derived = newScheduledRedemptionPolicy(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateScheduledRedemptionPolicy(item: ScheduledRedemptionPolicy): string {
  return lenientLevelProposalBucket(item.projectedLoad());
}
