import { AdaptiveJourneyBaseline } from "../../journey/journey-baseline/adaptive-journey-baseline.js";
import { classifyGlobalJourneyDigest } from "../../journey/journey-baseline/global-journey-digest-policy.js";
import { ScheduledBranchAdjustment, newScheduledBranchAdjustment } from "./scheduled-branch-adjustment.js";

export function summarizeAdaptiveJourneyBaselinesForAdjustment(items: AdaptiveJourneyBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveScheduledBranchAdjustmentsFromBaseline(items: AdaptiveJourneyBaseline[]): ScheduledBranchAdjustment[] {
  const out: ScheduledBranchAdjustment[] = [];
  for (const item of items) {
    const derived = newScheduledBranchAdjustment(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeScheduledBranchAdjustment(item: ScheduledBranchAdjustment): string {
  return classifyGlobalJourneyDigest(item.effectiveExposure());
}
