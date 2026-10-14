import { preferenceSegmentBucket } from "../../preference/schedule/preference-segment-policy.js";
import { PreferenceSegment } from "../../preference/schedule/preference-segment.js";
import { OptOutPlan, newOptOutPlan } from "./opt-out-plan.js";

export function summarizePreferenceSegmentsForPlan(items: PreferenceSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveOptOutPlansFromSegment(items: PreferenceSegment[]): OptOutPlan[] {
  const out: OptOutPlan[] = [];
  for (const item of items) {
    const derived = newOptOutPlan(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeOptOutPlan(item: OptOutPlan): string {
  return preferenceSegmentBucket(item.projectedExposure());
}
