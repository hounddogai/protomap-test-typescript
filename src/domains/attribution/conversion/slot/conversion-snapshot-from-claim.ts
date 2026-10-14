import { CreditClaim } from "../../credit/claim/credit-claim.js";
import { creditReservationBucket } from "../../credit/claim/credit-reservation-policy.js";
import { ConversionSnapshot, newConversionSnapshot } from "./conversion-snapshot.js";

export function summarizeCreditClaimsForSnapshot(items: CreditClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveConversionSnapshotsFromClaim(items: CreditClaim[]): ConversionSnapshot[] {
  const out: ConversionSnapshot[] = [];
  for (const item of items) {
    const derived = newConversionSnapshot(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyConversionSnapshot(item: ConversionSnapshot): string {
  return creditReservationBucket(item.projectedExposure());
}
