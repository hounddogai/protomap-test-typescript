import { ReputationTarget } from "../reputation-override/reputation-target.js";
import { strictReputationOverrideWeight } from "../reputation-override/strict-reputation-override-policy.js";
import { ReputationTier, newReputationTier } from "./reputation-tier.js";

export function summarizeReputationTargetsForTier(items: ReputationTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveReputationTiersFromTarget(items: ReputationTarget[]): ReputationTier[] {
  const out: ReputationTier[] = [];
  for (const item of items) {
    const derived = newReputationTier(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeReputationTier(item: ReputationTier): number {
  return strictReputationOverrideWeight(2, true);
}
