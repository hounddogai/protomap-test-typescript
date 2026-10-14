import { PrimaryBadgeForecast } from "../../badge/assignment/primary-badge-forecast.js";
import { classifyRollingBadgeAssignment } from "../../badge/assignment/rolling-badge-assignment-policy.js";
import { GlobalRewardEstimate, newGlobalRewardEstimate } from "./global-reward-estimate.js";

export function summarizePrimaryBadgeForecastsForEstimate(items: PrimaryBadgeForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveGlobalRewardEstimatesFromForecast(items: PrimaryBadgeForecast[]): GlobalRewardEstimate[] {
  const out: GlobalRewardEstimate[] = [];
  for (const item of items) {
    const derived = newGlobalRewardEstimate(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreGlobalRewardEstimate(item: GlobalRewardEstimate): string {
  return classifyRollingBadgeAssignment(item.projectedVolume());
}
