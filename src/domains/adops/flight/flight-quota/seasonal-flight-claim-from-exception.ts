import { FrequencyException } from "../../frequency/threshold/frequency-exception.js";
import { classifyFrequencyRequest } from "../../frequency/threshold/frequency-request-policy.js";
import { SeasonalFlightClaim, newSeasonalFlightClaim } from "./seasonal-flight-claim.js";

export function summarizeFrequencyExceptionsForClaim(items: FrequencyException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveSeasonalFlightClaimsFromException(items: FrequencyException[]): SeasonalFlightClaim[] {
  const out: SeasonalFlightClaim[] = [];
  for (const item of items) {
    const derived = newSeasonalFlightClaim(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateSeasonalFlightClaim(item: SeasonalFlightClaim): string {
  return classifyFrequencyRequest(item.netValue());
}
