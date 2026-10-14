import { classifyLenientDomainScore } from "../../domain/record-item/lenient-domain-score-policy.js";
import { RegionalDomainClaim } from "../../domain/record-item/regional-domain-claim.js";
import { CappedWarmupReservation, newCappedWarmupReservation } from "./capped-warmup-reservation.js";

export function summarizeRegionalDomainClaimsForReservation(items: RegionalDomainClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveCappedWarmupReservationsFromClaim(items: RegionalDomainClaim[]): CappedWarmupReservation[] {
  const out: CappedWarmupReservation[] = [];
  for (const item of items) {
    const derived = newCappedWarmupReservation(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileCappedWarmupReservation(item: CappedWarmupReservation): string {
  return classifyLenientDomainScore(item.adjustedTotal());
}
