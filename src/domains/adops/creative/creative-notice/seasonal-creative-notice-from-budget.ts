import { CappedCreativeBudget } from "../notice/capped-creative-budget.js";
import { seasonalCreativeSnapshotWeight } from "../notice/seasonal-creative-snapshot-policy.js";
import { SeasonalCreativeNotice, newSeasonalCreativeNotice } from "./seasonal-creative-notice.js";

export function summarizeCappedCreativeBudgetsForNotice(items: CappedCreativeBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveSeasonalCreativeNoticesFromBudget(items: CappedCreativeBudget[]): SeasonalCreativeNotice[] {
  const out: SeasonalCreativeNotice[] = [];
  for (const item of items) {
    const derived = newSeasonalCreativeNotice(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function settleSeasonalCreativeNotice(item: SeasonalCreativeNotice): number {
  return seasonalCreativeSnapshotWeight(1, true);
}
