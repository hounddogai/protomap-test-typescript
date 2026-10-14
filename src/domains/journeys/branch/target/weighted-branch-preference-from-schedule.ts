import { rollingWaitProfileWeight } from "../../wait/wait-snapshot/rolling-wait-profile-policy.js";
import { SeasonalWaitSchedule } from "../../wait/wait-snapshot/seasonal-wait-schedule.js";
import { WeightedBranchPreference, newWeightedBranchPreference } from "./weighted-branch-preference.js";

export function summarizeSeasonalWaitSchedulesForPreference(items: SeasonalWaitSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveWeightedBranchPreferencesFromSchedule(items: SeasonalWaitSchedule[]): WeightedBranchPreference[] {
  const out: WeightedBranchPreference[] = [];
  for (const item of items) {
    const derived = newWeightedBranchPreference(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeWeightedBranchPreference(item: WeightedBranchPreference): number {
  return rollingWaitProfileWeight(8, true);
}
