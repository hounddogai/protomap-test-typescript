import { redemptionClaimWeight } from "../../redemption/estimate/redemption-claim-policy.js";
import { RedemptionClaim } from "../../redemption/estimate/redemption-claim.js";
import { CappedBadgeForecast, newCappedBadgeForecast } from "./capped-badge-forecast.js";

export function summarizeRedemptionClaimsForForecast(items: RedemptionClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveCappedBadgeForecastsFromClaim(items: RedemptionClaim[]): CappedBadgeForecast[] {
  const out: CappedBadgeForecast[] = [];
  for (const item of items) {
    const derived = newCappedBadgeForecast(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectCappedBadgeForecast(item: CappedBadgeForecast): number {
  return redemptionClaimWeight(5, true);
}
