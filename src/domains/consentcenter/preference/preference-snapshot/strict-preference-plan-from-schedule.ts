import { manualPreferenceTemplateBucket } from "../preference-schedule/manual-preference-template-policy.js";
import { RollingPreferenceSchedule } from "../preference-schedule/rolling-preference-schedule.js";
import { StrictPreferencePlan, newStrictPreferencePlan } from "./strict-preference-plan.js";

export function summarizeRollingPreferenceSchedulesForPlan(items: RollingPreferenceSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveStrictPreferencePlansFromSchedule(items: RollingPreferenceSchedule[]): StrictPreferencePlan[] {
  const out: StrictPreferencePlan[] = [];
  for (const item of items) {
    const derived = newStrictPreferencePlan(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateStrictPreferencePlan(item: StrictPreferencePlan): string {
  return manualPreferenceTemplateBucket(item.weightedTotal());
}
