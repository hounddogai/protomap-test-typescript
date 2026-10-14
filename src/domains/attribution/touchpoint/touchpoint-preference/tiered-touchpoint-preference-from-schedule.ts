import { cappedTouchpointSummaryBucket } from "../touchpoint-reservation/capped-touchpoint-summary-policy.js";
import { TouchpointSchedule } from "../touchpoint-reservation/touchpoint-schedule.js";
import { TieredTouchpointPreference, newTieredTouchpointPreference } from "./tiered-touchpoint-preference.js";

export function summarizeTouchpointSchedulesForPreference(items: TouchpointSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveTieredTouchpointPreferencesFromSchedule(items: TouchpointSchedule[]): TieredTouchpointPreference[] {
  const out: TieredTouchpointPreference[] = [];
  for (const item of items) {
    const derived = newTieredTouchpointPreference(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreTieredTouchpointPreference(item: TieredTouchpointPreference): string {
  return cappedTouchpointSummaryBucket(item.projectedExposure());
}
