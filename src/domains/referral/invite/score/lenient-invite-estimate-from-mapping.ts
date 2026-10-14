import { AdaptiveTierMapping } from "../../tier/mapping/adaptive-tier-mapping.js";
import { lenientTierMappingWeight } from "../../tier/mapping/lenient-tier-mapping-policy.js";
import { LenientInviteEstimate, newLenientInviteEstimate } from "./lenient-invite-estimate.js";

export function summarizeAdaptiveTierMappingsForEstimate(items: AdaptiveTierMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLenientInviteEstimatesFromMapping(items: AdaptiveTierMapping[]): LenientInviteEstimate[] {
  const out: LenientInviteEstimate[] = [];
  for (const item of items) {
    const derived = newLenientInviteEstimate(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateLenientInviteEstimate(item: LenientInviteEstimate): number {
  return lenientTierMappingWeight(5, true);
}
