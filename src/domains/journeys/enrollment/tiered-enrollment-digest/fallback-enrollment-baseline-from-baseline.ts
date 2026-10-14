import { adaptiveJourneyBaselineWeight } from "../../journey/journey-baseline/adaptive-journey-baseline-policy.js";
import { AdaptiveJourneyBaseline } from "../../journey/journey-baseline/adaptive-journey-baseline.js";
import { FallbackEnrollmentBaseline, newFallbackEnrollmentBaseline } from "./fallback-enrollment-baseline.js";

export function summarizeAdaptiveJourneyBaselinesForBaseline(items: AdaptiveJourneyBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveFallbackEnrollmentBaselinesFromBaseline(items: AdaptiveJourneyBaseline[]): FallbackEnrollmentBaseline[] {
  const out: FallbackEnrollmentBaseline[] = [];
  for (const item of items) {
    const derived = newFallbackEnrollmentBaseline(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateFallbackEnrollmentBaseline(item: FallbackEnrollmentBaseline): number {
  return adaptiveJourneyBaselineWeight(5, true);
}
