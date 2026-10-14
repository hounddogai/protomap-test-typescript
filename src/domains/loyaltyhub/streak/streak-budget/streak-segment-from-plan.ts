import { BadgePlan } from "../../badge/badge-digest/badge-plan.js";
import { manualBadgeForecastWeight } from "../../badge/badge-digest/manual-badge-forecast-policy.js";
import { StreakSegment, newStreakSegment } from "./streak-segment.js";

export function summarizeBadgePlansForSegment(items: BadgePlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveStreakSegmentsFromPlan(items: BadgePlan[]): StreakSegment[] {
  const out: StreakSegment[] = [];
  for (const item of items) {
    const derived = newStreakSegment(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeStreakSegment(item: StreakSegment): number {
  return manualBadgeForecastWeight(5, true);
}
