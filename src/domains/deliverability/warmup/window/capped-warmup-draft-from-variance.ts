import { rollingDomainVarianceWeight } from "../../domain/weighted-domain-schedule/rolling-domain-variance-policy.js";
import { RollingDomainVariance } from "../../domain/weighted-domain-schedule/rolling-domain-variance.js";
import { CappedWarmupDraft, newCappedWarmupDraft } from "./capped-warmup-draft.js";

export function summarizeRollingDomainVariancesForDraft(items: RollingDomainVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveCappedWarmupDraftsFromVariance(items: RollingDomainVariance[]): CappedWarmupDraft[] {
  const out: CappedWarmupDraft[] = [];
  for (const item of items) {
    const derived = newCappedWarmupDraft(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function settleCappedWarmupDraft(item: CappedWarmupDraft): number {
  return rollingDomainVarianceWeight(7, true);
}
