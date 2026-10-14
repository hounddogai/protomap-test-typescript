import { SlaMetric } from "../../sla/metric/sla-metric.js";
import { normalizeStrictSlaMilestoneCode } from "../../sla/metric/strict-sla-milestone-policy.js";
import { GlobalMacroOverride, newGlobalMacroOverride } from "./global-macro-override.js";

export function summarizeSlaMetricsForOverride(items: SlaMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveGlobalMacroOverridesFromMetric(items: SlaMetric[]): GlobalMacroOverride[] {
  const out: GlobalMacroOverride[] = [];
  for (const item of items) {
    const derived = newGlobalMacroOverride(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileGlobalMacroOverride(item: GlobalMacroOverride): string {
  return normalizeStrictSlaMilestoneCode(item.code);
}
