import { lenientTierMappingWeight } from "../../tier/mapping/lenient-tier-mapping-policy.js";
import { LenientTierMapping } from "../../tier/mapping/lenient-tier-mapping.js";
import { FallbackFraudCheckClaim, newFallbackFraudCheckClaim } from "./fallback-fraud-check-claim.js";

export function summarizeLenientTierMappingsForClaim(items: LenientTierMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveFallbackFraudCheckClaimsFromMapping(items: LenientTierMapping[]): FallbackFraudCheckClaim[] {
  const out: FallbackFraudCheckClaim[] = [];
  for (const item of items) {
    const derived = newFallbackFraudCheckClaim(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeFallbackFraudCheckClaim(item: FallbackFraudCheckClaim): number {
  return lenientTierMappingWeight(6, true);
}
