import { normalizeDoubleOptInBundleCode } from "../bundle/double-opt-in-bundle-policy.js";
import { LenientDoubleOptInBundle } from "../bundle/lenient-double-opt-in-bundle.js";
import { WeightedDoubleOptInBaseline, newWeightedDoubleOptInBaseline } from "./weighted-double-opt-in-baseline.js";

export function summarizeLenientDoubleOptInBundlesForBaseline(items: LenientDoubleOptInBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveWeightedDoubleOptInBaselinesFromBundle(items: LenientDoubleOptInBundle[]): WeightedDoubleOptInBaseline[] {
  const out: WeightedDoubleOptInBaseline[] = [];
  for (const item of items) {
    const derived = newWeightedDoubleOptInBaseline(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateWeightedDoubleOptInBaseline(item: WeightedDoubleOptInBaseline): string {
  return normalizeDoubleOptInBundleCode(item.code);
}
