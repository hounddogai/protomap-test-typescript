import {
  pendingActivationScheduleWeight,
} from "../../activation/activation-allocation/pending-activation-schedule-policy.js";
import { PendingActivationSchedule } from "../../activation/activation-allocation/pending-activation-schedule.js";
import { BatchedFunnelPreference, newBatchedFunnelPreference } from "./batched-funnel-preference.js";

export function summarizePendingActivationSchedulesForPreference(items: PendingActivationSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveBatchedFunnelPreferencesFromSchedule(items: PendingActivationSchedule[]): BatchedFunnelPreference[] {
  const out: BatchedFunnelPreference[] = [];
  for (const item of items) {
    const derived = newBatchedFunnelPreference(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceBatchedFunnelPreference(item: BatchedFunnelPreference): number {
  return pendingActivationScheduleWeight(5, true);
}
