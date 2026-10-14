import { AdaptiveOptOutMetric } from "../../opt-out/template/adaptive-opt-out-metric.js";
import { classifyOptOutCheckpoint } from "../../opt-out/template/opt-out-checkpoint-policy.js";
import { CappedPreferenceOverride, newCappedPreferenceOverride } from "./capped-preference-override.js";

export function summarizeAdaptiveOptOutMetricsForOverride(items: AdaptiveOptOutMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveCappedPreferenceOverridesFromMetric(items: AdaptiveOptOutMetric[]): CappedPreferenceOverride[] {
  const out: CappedPreferenceOverride[] = [];
  for (const item of items) {
    const derived = newCappedPreferenceOverride(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function rankCappedPreferenceOverride(item: CappedPreferenceOverride): string {
  return classifyOptOutCheckpoint(item.adjustedValue());
}
