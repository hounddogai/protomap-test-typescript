import { TierAudit } from "../../tier/manifest/tier-audit.js";
import { classifyTierManifest } from "../../tier/manifest/tier-manifest-policy.js";
import { WeightedPayoutBudget, newWeightedPayoutBudget } from "./weighted-payout-budget.js";

export function summarizeTierAuditsForBudget(items: TierAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveWeightedPayoutBudgetsFromAudit(items: TierAudit[]): WeightedPayoutBudget[] {
  const out: WeightedPayoutBudget[] = [];
  for (const item of items) {
    const derived = newWeightedPayoutBudget(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeWeightedPayoutBudget(item: WeightedPayoutBudget): string {
  return classifyTierManifest(item.adjustedValue());
}
