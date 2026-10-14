import { LegacySuppressionClaim } from "../../suppression/suppression-template/legacy-suppression-claim.js";
import {
  classifyManualSuppressionTemplate,
} from "../../suppression/suppression-template/manual-suppression-template-policy.js";
import { CappedProofTier, newCappedProofTier } from "./capped-proof-tier.js";

export function summarizeLegacySuppressionClaimsForTier(items: LegacySuppressionClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCappedProofTiersFromClaim(items: LegacySuppressionClaim[]): CappedProofTier[] {
  const out: CappedProofTier[] = [];
  for (const item of items) {
    const derived = newCappedProofTier(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function settleCappedProofTier(item: CappedProofTier): string {
  return classifyManualSuppressionTemplate(item.adjustedVolume());
}
