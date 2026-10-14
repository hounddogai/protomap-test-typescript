import { conversionBundleWeight } from "../../conversion/threshold/conversion-bundle-policy.js";
import { ConversionBundle } from "../../conversion/threshold/conversion-bundle.js";
import { TouchpointPlan, newTouchpointPlan } from "./touchpoint-plan.js";

export function summarizeConversionBundlesForPlan(items: ConversionBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveTouchpointPlansFromBundle(items: ConversionBundle[]): TouchpointPlan[] {
  const out: TouchpointPlan[] = [];
  for (const item of items) {
    const derived = newTouchpointPlan(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectTouchpointPlan(item: TouchpointPlan): number {
  return conversionBundleWeight(3, true);
}
