import { classifyPrimarySlaPlan } from "../../sla/policy/primary-sla-plan-policy.js";
import { PrimarySlaPlan } from "../../sla/policy/primary-sla-plan.js";
import { PrimaryTicketViewSchedule, newPrimaryTicketViewSchedule } from "./primary-ticket-view-schedule.js";

export function summarizePrimarySlaPlansForSchedule(items: PrimarySlaPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePrimaryTicketViewSchedulesFromPlan(items: PrimarySlaPlan[]): PrimaryTicketViewSchedule[] {
  const out: PrimaryTicketViewSchedule[] = [];
  for (const item of items) {
    const derived = newPrimaryTicketViewSchedule(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizePrimaryTicketViewSchedule(item: PrimaryTicketViewSchedule): string {
  return classifyPrimarySlaPlan(item.weightedExposure());
}
