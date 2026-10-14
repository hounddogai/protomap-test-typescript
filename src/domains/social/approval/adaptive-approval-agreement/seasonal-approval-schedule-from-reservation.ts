import { RegionalInsightReservation } from "../../insight/group/regional-insight-reservation.js";
import { scheduledInsightTemplateWeight } from "../../insight/group/scheduled-insight-template-policy.js";
import { SeasonalApprovalSchedule, newSeasonalApprovalSchedule } from "./seasonal-approval-schedule.js";

export function summarizeRegionalInsightReservationsForSchedule(items: RegionalInsightReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveSeasonalApprovalSchedulesFromReservation(items: RegionalInsightReservation[]): SeasonalApprovalSchedule[] {
  const out: SeasonalApprovalSchedule[] = [];
  for (const item of items) {
    const derived = newSeasonalApprovalSchedule(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function assignSeasonalApprovalSchedule(item: SeasonalApprovalSchedule): number {
  return scheduledInsightTemplateWeight(7, true);
}
