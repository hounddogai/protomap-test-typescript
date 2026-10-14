import { FunnelSchedule } from "../slot/funnel-schedule.js";
import { scheduledFunnelSlotWeight } from "../slot/scheduled-funnel-slot-policy.js";
import { ManualFunnelException, newManualFunnelException } from "./manual-funnel-exception.js";

export function summarizeFunnelSchedulesForException(items: FunnelSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveManualFunnelExceptionsFromSchedule(items: FunnelSchedule[]): ManualFunnelException[] {
  const out: ManualFunnelException[] = [];
  for (const item of items) {
    const derived = newManualFunnelException(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function projectManualFunnelException(item: ManualFunnelException): number {
  return scheduledFunnelSlotWeight(3, true);
}
