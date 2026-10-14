import { CohortSegment } from "../../cohort/policy/cohort-segment.js";
import { classifyLenientCohortSchedule } from "../../cohort/policy/lenient-cohort-schedule-policy.js";
import { PaywallBaseline, newPaywallBaseline } from "./paywall-baseline.js";

export function summarizeCohortSegmentsForBaseline(items: CohortSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePaywallBaselinesFromSegment(items: CohortSegment[]): PaywallBaseline[] {
  const out: PaywallBaseline[] = [];
  for (const item of items) {
    const derived = newPaywallBaseline(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function rankPaywallBaseline(item: PaywallBaseline): string {
  return classifyLenientCohortSchedule(item.projectedExposure());
}
