import { normalizeFunnelEntryCode } from "../../funnel/fallback-funnel-request/funnel-entry-policy.js";
import { RegionalFunnelRequest } from "../../funnel/fallback-funnel-request/regional-funnel-request.js";
import { TieredRetentionBudget, newTieredRetentionBudget } from "./tiered-retention-budget.js";

export function summarizeRegionalFunnelRequestsForBudget(items: RegionalFunnelRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveTieredRetentionBudgetsFromRequest(items: RegionalFunnelRequest[]): TieredRetentionBudget[] {
  const out: TieredRetentionBudget[] = [];
  for (const item of items) {
    const derived = newTieredRetentionBudget(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateTieredRetentionBudget(item: TieredRetentionBudget): string {
  return normalizeFunnelEntryCode(item.code);
}
