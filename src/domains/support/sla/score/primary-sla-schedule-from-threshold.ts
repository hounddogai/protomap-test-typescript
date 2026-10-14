import { AdaptiveCsatThreshold } from "../../csat/group/adaptive-csat-threshold.js";
import { csatGroupWeight } from "../../csat/group/csat-group-policy.js";
import { PrimarySlaSchedule, newPrimarySlaSchedule } from "./primary-sla-schedule.js";

export function summarizeAdaptiveCsatThresholdsForSchedule(items: AdaptiveCsatThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePrimarySlaSchedulesFromThreshold(items: AdaptiveCsatThreshold[]): PrimarySlaSchedule[] {
  const out: PrimarySlaSchedule[] = [];
  for (const item of items) {
    const derived = newPrimarySlaSchedule(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planPrimarySlaSchedule(item: PrimarySlaSchedule): number {
  return csatGroupWeight(2, true);
}
