import { classifyLegacyMacroPlan } from "../../macro/score/legacy-macro-plan-policy.js";
import { LegacyMacroPlan } from "../../macro/score/legacy-macro-plan.js";
import { RollingEscalationSchedule, newRollingEscalationSchedule } from "./rolling-escalation-schedule.js";

export function summarizeLegacyMacroPlansForSchedule(items: LegacyMacroPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveRollingEscalationSchedulesFromPlan(items: LegacyMacroPlan[]): RollingEscalationSchedule[] {
  const out: RollingEscalationSchedule[] = [];
  for (const item of items) {
    const derived = newRollingEscalationSchedule(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function computeRollingEscalationScheduleExtra(item: RollingEscalationSchedule): string {
  return classifyLegacyMacroPlan(item.effectiveLoad());
}
