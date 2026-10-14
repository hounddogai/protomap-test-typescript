import { GlobalCsatTemplate } from "../../csat/rule/global-csat-template.js";
import { weightedCsatRuleBucket } from "../../csat/rule/weighted-csat-rule-policy.js";
import { SeasonalEscalationSchedule, newSeasonalEscalationSchedule } from "./seasonal-escalation-schedule.js";

export function summarizeGlobalCsatTemplatesForSchedule(items: GlobalCsatTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveSeasonalEscalationSchedulesFromTemplate(items: GlobalCsatTemplate[]): SeasonalEscalationSchedule[] {
  const out: SeasonalEscalationSchedule[] = [];
  for (const item of items) {
    const derived = newSeasonalEscalationSchedule(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeSeasonalEscalationSchedule(item: SeasonalEscalationSchedule): string {
  return weightedCsatRuleBucket(item.projectedVolume());
}
