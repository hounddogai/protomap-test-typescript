import {
  normalizeCappedRetentionAllocationCode,
} from "../../retention/threshold/capped-retention-allocation-policy.js";
import { ManualRetentionPlan } from "../../retention/threshold/manual-retention-plan.js";
import { CappedCohortSchedule, newCappedCohortSchedule } from "./capped-cohort-schedule.js";

export function summarizeManualRetentionPlansForSchedule(items: ManualRetentionPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveCappedCohortSchedulesFromPlan(items: ManualRetentionPlan[]): CappedCohortSchedule[] {
  const out: CappedCohortSchedule[] = [];
  for (const item of items) {
    const derived = newCappedCohortSchedule(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeCappedCohortSchedule(item: CappedCohortSchedule): string {
  return normalizeCappedRetentionAllocationCode(item.code);
}
