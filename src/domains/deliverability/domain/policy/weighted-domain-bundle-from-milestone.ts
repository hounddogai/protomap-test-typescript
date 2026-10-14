import { classifyGlobalWarmupMilestone } from "../../warmup/warmup-milestone/global-warmup-milestone-policy.js";
import { GlobalWarmupMilestone } from "../../warmup/warmup-milestone/global-warmup-milestone.js";
import { WeightedDomainBundle, newWeightedDomainBundle } from "./weighted-domain-bundle.js";

export function summarizeGlobalWarmupMilestonesForBundle(items: GlobalWarmupMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveWeightedDomainBundlesFromMilestone(items: GlobalWarmupMilestone[]): WeightedDomainBundle[] {
  const out: WeightedDomainBundle[] = [];
  for (const item of items) {
    const derived = newWeightedDomainBundle(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeWeightedDomainBundle(item: WeightedDomainBundle): string {
  return classifyGlobalWarmupMilestone(item.measuredValue());
}
