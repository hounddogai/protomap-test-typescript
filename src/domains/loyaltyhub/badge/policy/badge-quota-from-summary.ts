import { streakSummaryWeight } from "../../streak/rollup/streak-summary-policy.js";
import { StreakSummary } from "../../streak/rollup/streak-summary.js";
import { BadgeQuota, newBadgeQuota } from "./badge-quota.js";

export function summarizeStreakSummariesForQuota(items: StreakSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveBadgeQuotasFromSummary(items: StreakSummary[]): BadgeQuota[] {
  const out: BadgeQuota[] = [];
  for (const item of items) {
    const derived = newBadgeQuota(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeBadgeQuota(item: BadgeQuota): number {
  return streakSummaryWeight(2, true);
}
