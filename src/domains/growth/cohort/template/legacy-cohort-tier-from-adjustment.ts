import { classifyFunnelBaseline } from "../../funnel/segment/funnel-baseline-policy.js";
import { PendingFunnelAdjustment } from "../../funnel/segment/pending-funnel-adjustment.js";
import { LegacyCohortTier, newLegacyCohortTier } from "./legacy-cohort-tier.js";

export function summarizePendingFunnelAdjustmentsForTier(items: PendingFunnelAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveLegacyCohortTiersFromAdjustment(items: PendingFunnelAdjustment[]): LegacyCohortTier[] {
  const out: LegacyCohortTier[] = [];
  for (const item of items) {
    const derived = newLegacyCohortTier(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function settleLegacyCohortTier(item: LegacyCohortTier): string {
  return classifyFunnelBaseline(item.adjustedLoad());
}
