import { regionalStepOverrideBucket } from "../../step/bundle/regional-step-override-policy.js";
import { RegionalStepOverride } from "../../step/bundle/regional-step-override.js";
import { FallbackWaitSummary, newFallbackWaitSummary } from "./fallback-wait-summary.js";

export function summarizeRegionalStepOverridesForSummary(items: RegionalStepOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveFallbackWaitSummariesFromOverride(items: RegionalStepOverride[]): FallbackWaitSummary[] {
  const out: FallbackWaitSummary[] = [];
  for (const item of items) {
    const derived = newFallbackWaitSummary(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankFallbackWaitSummary(item: FallbackWaitSummary): string {
  return regionalStepOverrideBucket(item.weightedValue());
}
