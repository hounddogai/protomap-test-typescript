import { classifyActivationSummary } from "../../activation/summary/activation-summary-policy.js";
import { ActivationSummary } from "../../activation/summary/activation-summary.js";
import { RetentionTier, newRetentionTier } from "./retention-tier.js";

export function summarizeActivationSummariesForTier(items: ActivationSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveRetentionTiersFromSummary(items: ActivationSummary[]): RetentionTier[] {
  const out: RetentionTier[] = [];
  for (const item of items) {
    const derived = newRetentionTier(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function planRetentionTier(item: RetentionTier): string {
  return classifyActivationSummary(item.effectiveTotal());
}
