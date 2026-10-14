import { ManualTouchpointBundle } from "../estimate/manual-touchpoint-bundle.js";
import { classifyWeightedTouchpointEstimate } from "../estimate/weighted-touchpoint-estimate-policy.js";
import { CappedTouchpointSchedule, newCappedTouchpointSchedule } from "./capped-touchpoint-schedule.js";

export function summarizeManualTouchpointBundlesForSchedule(items: ManualTouchpointBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveCappedTouchpointSchedulesFromBundle(items: ManualTouchpointBundle[]): CappedTouchpointSchedule[] {
  const out: CappedTouchpointSchedule[] = [];
  for (const item of items) {
    const derived = newCappedTouchpointSchedule(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyCappedTouchpointSchedule(item: CappedTouchpointSchedule): string {
  return classifyWeightedTouchpointEstimate(item.measuredValue());
}
