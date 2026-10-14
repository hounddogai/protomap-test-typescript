import { normalizeFallbackBidRuleSnapshotCode } from "../../bid-rule/snapshot/fallback-bid-rule-snapshot-policy.js";
import { RegionalBidRuleForecast } from "../../bid-rule/snapshot/regional-bid-rule-forecast.js";
import { FlightAssignment, newFlightAssignment } from "./flight-assignment.js";

export function summarizeRegionalBidRuleForecastsForAssignment(items: RegionalBidRuleForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveFlightAssignmentsFromForecast(items: RegionalBidRuleForecast[]): FlightAssignment[] {
  const out: FlightAssignment[] = [];
  for (const item of items) {
    const derived = newFlightAssignment(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleFlightAssignment(item: FlightAssignment): string {
  return normalizeFallbackBidRuleSnapshotCode(item.code);
}
