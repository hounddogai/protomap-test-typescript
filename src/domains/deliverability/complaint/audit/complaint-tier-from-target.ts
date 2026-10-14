import { reputationTargetWeight } from "../../reputation/reputation-override/reputation-target-policy.js";
import { ReputationTarget } from "../../reputation/reputation-override/reputation-target.js";
import { ComplaintTier, newComplaintTier } from "./complaint-tier.js";

export function summarizeReputationTargetsForTier(items: ReputationTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveComplaintTiersFromTarget(items: ReputationTarget[]): ComplaintTier[] {
  const out: ComplaintTier[] = [];
  for (const item of items) {
    const derived = newComplaintTier(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileComplaintTier(item: ComplaintTier): number {
  return reputationTargetWeight(4, true);
}
