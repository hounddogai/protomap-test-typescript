import { normalizeScheduledFrequencyPlanCode } from "../../frequency/cycle/scheduled-frequency-plan-policy.js";
import { ScheduledFrequencyPlan } from "../../frequency/cycle/scheduled-frequency-plan.js";
import { LegacyCreativeOverride, newLegacyCreativeOverride } from "./legacy-creative-override.js";

export function summarizeScheduledFrequencyPlansForOverride(items: ScheduledFrequencyPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveLegacyCreativeOverridesFromPlan(items: ScheduledFrequencyPlan[]): LegacyCreativeOverride[] {
  const out: LegacyCreativeOverride[] = [];
  for (const item of items) {
    const derived = newLegacyCreativeOverride(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function settleLegacyCreativeOverride(item: LegacyCreativeOverride): string {
  return normalizeScheduledFrequencyPlanCode(item.code);
}
