import { BadgeCheckpoint } from "../../badge/checkpoint/badge-checkpoint.js";
import { normalizeBadgeProposalCode } from "../../badge/checkpoint/badge-proposal-policy.js";
import { RollingRedemptionVariance, newRollingRedemptionVariance } from "./rolling-redemption-variance.js";

export function summarizeBadgeCheckpointsForVariance(items: BadgeCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveRollingRedemptionVariancesFromCheckpoint(items: BadgeCheckpoint[]): RollingRedemptionVariance[] {
  const out: RollingRedemptionVariance[] = [];
  for (const item of items) {
    const derived = newRollingRedemptionVariance(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeRollingRedemptionVariance(item: RollingRedemptionVariance): string {
  return normalizeBadgeProposalCode(item.code);
}
