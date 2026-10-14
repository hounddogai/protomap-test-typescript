import { macroTemplateBucket } from "../../macro/macro-snapshot/macro-template-policy.js";
import { MacroTemplate } from "../../macro/macro-snapshot/macro-template.js";
import { WeightedEscalationSchedule, newWeightedEscalationSchedule } from "./weighted-escalation-schedule.js";

export function summarizeMacroTemplatesForSchedule(items: MacroTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveWeightedEscalationSchedulesFromTemplate(items: MacroTemplate[]): WeightedEscalationSchedule[] {
  const out: WeightedEscalationSchedule[] = [];
  for (const item of items) {
    const derived = newWeightedEscalationSchedule(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planWeightedEscalationSchedule(item: WeightedEscalationSchedule): string {
  return macroTemplateBucket(item.adjustedValue());
}
