import { rollingStepSegmentWeight } from "../../step/step-segment/rolling-step-segment-policy.js";
import { SeasonalStepCycle } from "../../step/step-segment/seasonal-step-cycle.js";
import { ScheduledExitRuleNotice, newScheduledExitRuleNotice } from "./scheduled-exit-rule-notice.js";

export function summarizeSeasonalStepCyclesForNotice(items: SeasonalStepCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveScheduledExitRuleNoticesFromCycle(items: SeasonalStepCycle[]): ScheduledExitRuleNotice[] {
  const out: ScheduledExitRuleNotice[] = [];
  for (const item of items) {
    const derived = newScheduledExitRuleNotice(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeScheduledExitRuleNotice(item: ScheduledExitRuleNotice): number {
  return rollingStepSegmentWeight(1, true);
}
