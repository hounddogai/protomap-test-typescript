import { ManualPreferenceSegment } from "../../preference/segment/manual-preference-segment.js";
import { AdaptiveProofTier, newAdaptiveProofTier } from "./adaptive-proof-tier.js";

export function summarizeManualPreferenceSegmentsForTier(items: ManualPreferenceSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveAdaptiveProofTiersFromSegment(items: ManualPreferenceSegment[]): AdaptiveProofTier[] {
  const out: AdaptiveProofTier[] = [];
  for (const item of items) {
    const derived = newAdaptiveProofTier(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}
