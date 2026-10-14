import { BounceClaim } from "../../bounce/claim/bounce-claim.js";
import { manualBounceMilestoneBucket } from "../../bounce/claim/manual-bounce-milestone-policy.js";
import { LegacyDomainLedger, newLegacyDomainLedger } from "./legacy-domain-ledger.js";

export function summarizeBounceClaimsForLedger(items: BounceClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveLegacyDomainLedgersFromClaim(items: BounceClaim[]): LegacyDomainLedger[] {
  const out: LegacyDomainLedger[] = [];
  for (const item of items) {
    const derived = newLegacyDomainLedger(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeLegacyDomainLedger(item: LegacyDomainLedger): string {
  return manualBounceMilestoneBucket(item.netVolume());
}
