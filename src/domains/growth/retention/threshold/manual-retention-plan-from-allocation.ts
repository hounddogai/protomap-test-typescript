import {
  normalizeScheduledRetentionAllocationCode,
} from "../retention-allocation/scheduled-retention-allocation-policy.js";
import { ScheduledRetentionAllocation } from "../retention-allocation/scheduled-retention-allocation.js";
import { ManualRetentionPlan, newManualRetentionPlan } from "./manual-retention-plan.js";

export function summarizeScheduledRetentionAllocationsForPlan(items: ScheduledRetentionAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveManualRetentionPlansFromAllocation(items: ScheduledRetentionAllocation[]): ManualRetentionPlan[] {
  const out: ManualRetentionPlan[] = [];
  for (const item of items) {
    const derived = newManualRetentionPlan(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeManualRetentionPlan(item: ManualRetentionPlan): string {
  return normalizeScheduledRetentionAllocationCode(item.code);
}
