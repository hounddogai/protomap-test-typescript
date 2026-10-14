import { primaryTierSegmentBucket } from "../schedule/primary-tier-segment-policy.js";
import { TierSchedule } from "../schedule/tier-schedule.js";
import { TierAdjustment, newTierAdjustment } from "./tier-adjustment.js";

export function summarizeTierSchedulesForAdjustment(items: TierSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTierAdjustmentsFromSchedule(items: TierSchedule[]): TierAdjustment[] {
  const out: TierAdjustment[] = [];
  for (const item of items) {
    const derived = newTierAdjustment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreTierAdjustment(item: TierAdjustment): string {
  return primaryTierSegmentBucket(item.effectiveVolume());
}
