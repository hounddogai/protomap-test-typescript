import {
  normalizeAdaptiveEnrollmentBaselineCode,
} from "../../enrollment/adaptive-enrollment-digest/adaptive-enrollment-baseline-policy.js";
import {
  AdaptiveEnrollmentBaseline,
} from "../../enrollment/adaptive-enrollment-digest/adaptive-enrollment-baseline.js";
import { WeightedJourneyTemplate, newWeightedJourneyTemplate } from "./weighted-journey-template.js";

export function summarizeAdaptiveEnrollmentBaselinesForTemplate(items: AdaptiveEnrollmentBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveWeightedJourneyTemplatesFromBaseline(items: AdaptiveEnrollmentBaseline[]): WeightedJourneyTemplate[] {
  const out: WeightedJourneyTemplate[] = [];
  for (const item of items) {
    const derived = newWeightedJourneyTemplate(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreWeightedJourneyTemplate(item: WeightedJourneyTemplate): string {
  return normalizeAdaptiveEnrollmentBaselineCode(item.code);
}
