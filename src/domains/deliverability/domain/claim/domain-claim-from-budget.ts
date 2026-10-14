import { scheduledWarmupRecordBucket } from "../../warmup/milestone/scheduled-warmup-record-policy.js";
import { SeasonalWarmupBudget } from "../../warmup/milestone/seasonal-warmup-budget.js";
import { DomainClaim, newDomainClaim } from "./domain-claim.js";

export function summarizeSeasonalWarmupBudgetsForClaim(items: SeasonalWarmupBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveDomainClaimsFromBudget(items: SeasonalWarmupBudget[]): DomainClaim[] {
  const out: DomainClaim[] = [];
  for (const item of items) {
    const derived = newDomainClaim(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceDomainClaim(item: DomainClaim): string {
  return scheduledWarmupRecordBucket(item.adjustedValue());
}
