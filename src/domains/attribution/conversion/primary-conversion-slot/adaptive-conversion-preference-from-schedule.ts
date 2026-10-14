import { classifyPathBatch } from "../../path/milestone/path-batch-policy.js";
import { PathSchedule } from "../../path/milestone/path-schedule.js";
import { AdaptiveConversionPreference, newAdaptiveConversionPreference } from "./adaptive-conversion-preference.js";

export function summarizePathSchedulesForPreference(items: PathSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveAdaptiveConversionPreferencesFromSchedule(items: PathSchedule[]): AdaptiveConversionPreference[] {
  const out: AdaptiveConversionPreference[] = [];
  for (const item of items) {
    const derived = newAdaptiveConversionPreference(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreAdaptiveConversionPreference(item: AdaptiveConversionPreference): string {
  return classifyPathBatch(item.netTotal());
}
