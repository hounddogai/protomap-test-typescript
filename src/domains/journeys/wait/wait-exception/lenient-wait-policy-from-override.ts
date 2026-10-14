import { FallbackStepOverride } from "../../step/rollup/fallback-step-override.js";
import { legacyStepForecastWeight } from "../../step/rollup/legacy-step-forecast-policy.js";
import { LenientWaitPolicy, newLenientWaitPolicy } from "./lenient-wait-policy.js";

export function summarizeFallbackStepOverridesForPolicy(items: FallbackStepOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveLenientWaitPoliciesFromOverride(items: FallbackStepOverride[]): LenientWaitPolicy[] {
  const out: LenientWaitPolicy[] = [];
  for (const item of items) {
    const derived = newLenientWaitPolicy(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeLenientWaitPolicy(item: LenientWaitPolicy): number {
  return legacyStepForecastWeight(6, true);
}
