import { classifyModelReview } from "../../model/model-record/model-review-policy.js";
import { SeasonalModelRecord } from "../../model/model-record/seasonal-model-record.js";
import { GlobalTouchpointPlan, newGlobalTouchpointPlan } from "./global-touchpoint-plan.js";

export function summarizeSeasonalModelRecordsForPlan(items: SeasonalModelRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveGlobalTouchpointPlansFromRecord(items: SeasonalModelRecord[]): GlobalTouchpointPlan[] {
  const out: GlobalTouchpointPlan[] = [];
  for (const item of items) {
    const derived = newGlobalTouchpointPlan(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function splitGlobalTouchpointPlan(item: GlobalTouchpointPlan): string {
  return classifyModelReview(item.netVolume());
}
