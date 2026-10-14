import { normalizeRegionalPlacementProposalCode } from "../../placement/audit/regional-placement-proposal-policy.js";
import { SeasonalPlacementSchedule } from "../../placement/audit/seasonal-placement-schedule.js";
import { LenientFlightPlan, newLenientFlightPlan } from "./lenient-flight-plan.js";

export function summarizeSeasonalPlacementSchedulesForPlan(items: SeasonalPlacementSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveLenientFlightPlansFromSchedule(items: SeasonalPlacementSchedule[]): LenientFlightPlan[] {
  const out: LenientFlightPlan[] = [];
  for (const item of items) {
    const derived = newLenientFlightPlan(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function rankLenientFlightPlan(item: LenientFlightPlan): string {
  return normalizeRegionalPlacementProposalCode(item.code);
}
