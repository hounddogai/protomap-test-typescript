import { DefaultTierSegment } from "../../tier/segment/default-tier-segment.js";
import { primaryTierForecastWeight } from "../../tier/segment/primary-tier-forecast-policy.js";
import { BatchedInviteSchedule, newBatchedInviteSchedule } from "./batched-invite-schedule.js";

export function summarizeDefaultTierSegmentsForSchedule(items: DefaultTierSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveBatchedInviteSchedulesFromSegment(items: DefaultTierSegment[]): BatchedInviteSchedule[] {
  const out: BatchedInviteSchedule[] = [];
  for (const item of items) {
    const derived = newBatchedInviteSchedule(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileBatchedInviteSchedule(item: BatchedInviteSchedule): number {
  return primaryTierForecastWeight(6, true);
}
