import { CappedCreditSegment } from "../../credit/forecast/capped-credit-segment.js";
import { normalizeCreditForecastCode } from "../../credit/forecast/credit-forecast-policy.js";
import { WindowTier, newWindowTier } from "./window-tier.js";

export function summarizeCappedCreditSegmentsForTier(items: CappedCreditSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveWindowTiersFromSegment(items: CappedCreditSegment[]): WindowTier[] {
  const out: WindowTier[] = [];
  for (const item of items) {
    const derived = newWindowTier(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeWindowTier(item: WindowTier): string {
  return normalizeCreditForecastCode(item.code);
}
