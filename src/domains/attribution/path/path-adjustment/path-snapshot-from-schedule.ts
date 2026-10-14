import { creditEstimateWeight } from "../../credit/metric/credit-estimate-policy.js";
import { FallbackCreditSchedule } from "../../credit/metric/fallback-credit-schedule.js";
import { PathSnapshot, newPathSnapshot } from "./path-snapshot.js";

export function summarizeFallbackCreditSchedulesForSnapshot(items: FallbackCreditSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function derivePathSnapshotsFromSchedule(items: FallbackCreditSchedule[]): PathSnapshot[] {
  const out: PathSnapshot[] = [];
  for (const item of items) {
    const derived = newPathSnapshot(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolvePathSnapshot(item: PathSnapshot): number {
  return creditEstimateWeight(7, true);
}
