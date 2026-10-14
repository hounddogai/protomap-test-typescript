import { BranchAdjustment } from "../review/branch-adjustment.js";
import { regionalBranchDigestWeight } from "../review/regional-branch-digest-policy.js";
import { BranchTier, newBranchTier } from "./branch-tier.js";

export function summarizeBranchAdjustmentsForTier(items: BranchAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveBranchTiersFromAdjustment(items: BranchAdjustment[]): BranchTier[] {
  const out: BranchTier[] = [];
  for (const item of items) {
    const derived = newBranchTier(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyBranchTier(item: BranchTier): number {
  return regionalBranchDigestWeight(7, true);
}
