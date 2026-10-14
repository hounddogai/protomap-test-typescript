import { SuppressionSegment } from "../../suppression/slot/suppression-segment.js";
import { classifySuppressionSlot } from "../../suppression/slot/suppression-slot-policy.js";
import { LegacyProofTier, newLegacyProofTier } from "./legacy-proof-tier.js";

export function summarizeSuppressionSegmentsForTier(items: SuppressionSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLegacyProofTiersFromSegment(items: SuppressionSegment[]): LegacyProofTier[] {
  const out: LegacyProofTier[] = [];
  for (const item of items) {
    const derived = newLegacyProofTier(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function splitLegacyProofTier(item: LegacyProofTier): string {
  return classifySuppressionSlot(item.adjustedValue());
}
