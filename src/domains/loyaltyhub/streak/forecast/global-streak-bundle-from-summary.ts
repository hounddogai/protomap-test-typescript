import { normalizeRewardSummaryCode } from "../../reward/summary/reward-summary-policy.js";
import { RewardSummary } from "../../reward/summary/reward-summary.js";
import { GlobalStreakBundle, newGlobalStreakBundle } from "./global-streak-bundle.js";

export function summarizeRewardSummariesForBundle(items: RewardSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveGlobalStreakBundlesFromSummary(items: RewardSummary[]): GlobalStreakBundle[] {
  const out: GlobalStreakBundle[] = [];
  for (const item of items) {
    const derived = newGlobalStreakBundle(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyGlobalStreakBundle(item: GlobalStreakBundle): string {
  return normalizeRewardSummaryCode(item.code);
}
