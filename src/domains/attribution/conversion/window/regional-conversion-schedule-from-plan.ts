import { PrimaryModelPlan } from "../../model/model-entry/primary-model-plan.js";
import { regionalModelEntryBucket } from "../../model/model-entry/regional-model-entry-policy.js";
import { RegionalConversionSchedule, newRegionalConversionSchedule } from "./regional-conversion-schedule.js";

export function summarizePrimaryModelPlansForSchedule(items: PrimaryModelPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRegionalConversionSchedulesFromPlan(items: PrimaryModelPlan[]): RegionalConversionSchedule[] {
  const out: RegionalConversionSchedule[] = [];
  for (const item of items) {
    const derived = newRegionalConversionSchedule(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeRegionalConversionSchedule(item: RegionalConversionSchedule): string {
  return regionalModelEntryBucket(item.effectiveVolume());
}
