import { classifyReputationForecast } from "../../reputation/claim/reputation-forecast-policy.js";
import { SeasonalReputationThreshold } from "../../reputation/claim/seasonal-reputation-threshold.js";
import { StrictBounceReservation, newStrictBounceReservation } from "./strict-bounce-reservation.js";

export function summarizeSeasonalReputationThresholdsForReservation(items: SeasonalReputationThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveStrictBounceReservationsFromThreshold(items: SeasonalReputationThreshold[]): StrictBounceReservation[] {
  const out: StrictBounceReservation[] = [];
  for (const item of items) {
    const derived = newStrictBounceReservation(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyStrictBounceReservation(item: StrictBounceReservation): string {
  return classifyReputationForecast(item.measuredValue());
}
