import { normalizeLevelQuotaCode } from "../../level/quota/level-quota-policy.js";
import { LevelQuota } from "../../level/quota/level-quota.js";
import { SeasonalBadgeBudget, newSeasonalBadgeBudget } from "./seasonal-badge-budget.js";

export function summarizeLevelQuotasForBudget(items: LevelQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveSeasonalBadgeBudgetsFromQuota(items: LevelQuota[]): SeasonalBadgeBudget[] {
  const out: SeasonalBadgeBudget[] = [];
  for (const item of items) {
    const derived = newSeasonalBadgeBudget(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignSeasonalBadgeBudget(item: SeasonalBadgeBudget): string {
  return normalizeLevelQuotaCode(item.code);
}
