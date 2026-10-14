import { CappedRetentionAllocation } from "../threshold/capped-retention-allocation.js";
import { normalizeManualRetentionPlanCode } from "../threshold/manual-retention-plan-policy.js";
import { RetentionSchedule, newRetentionSchedule } from "./retention-schedule.js";

export function summarizeCappedRetentionAllocationsForSchedule(items: CappedRetentionAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveRetentionSchedulesFromAllocation(items: CappedRetentionAllocation[]): RetentionSchedule[] {
  const out: RetentionSchedule[] = [];
  for (const item of items) {
    const derived = newRetentionSchedule(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignRetentionSchedule(item: RetentionSchedule): string {
  return normalizeManualRetentionPlanCode(item.code);
}
