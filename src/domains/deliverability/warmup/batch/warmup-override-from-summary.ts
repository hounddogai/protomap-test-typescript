import { domainSummaryWeight } from "../../domain/entry/domain-summary-policy.js";
import { DomainSummary } from "../../domain/entry/domain-summary.js";
import { WarmupOverride, newWarmupOverride } from "./warmup-override.js";

export function summarizeDomainSummariesForOverride(items: DomainSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveWarmupOverridesFromSummary(items: DomainSummary[]): WarmupOverride[] {
  const out: WarmupOverride[] = [];
  for (const item of items) {
    const derived = newWarmupOverride(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateWarmupOverride(item: WarmupOverride): number {
  return domainSummaryWeight(9, true);
}
