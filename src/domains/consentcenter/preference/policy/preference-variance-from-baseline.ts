import {
  normalizeWeightedDoubleOptInBaselineCode,
} from "../../double-opt-in/in-baseline/weighted-double-opt-in-baseline-policy.js";
import { WeightedDoubleOptInBaseline } from "../../double-opt-in/in-baseline/weighted-double-opt-in-baseline.js";
import { PreferenceVariance, newPreferenceVariance } from "./preference-variance.js";

export function summarizeWeightedDoubleOptInBaselinesForVariance(items: WeightedDoubleOptInBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function derivePreferenceVariancesFromBaseline(items: WeightedDoubleOptInBaseline[]): PreferenceVariance[] {
  const out: PreferenceVariance[] = [];
  for (const item of items) {
    const derived = newPreferenceVariance(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function settlePreferenceVariance(item: PreferenceVariance): string {
  return normalizeWeightedDoubleOptInBaselineCode(item.code);
}
