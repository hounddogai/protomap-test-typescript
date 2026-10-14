import { SeasonalSlaDigest } from "../../sla/sla-reservation/seasonal-sla-digest.js";
import { normalizeSlaBatchCode } from "../../sla/sla-reservation/sla-batch-policy.js";
import { StrictCsatQuota, newStrictCsatQuota } from "./strict-csat-quota.js";

export function summarizeSeasonalSlaDigestsForQuota(items: SeasonalSlaDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveStrictCsatQuotasFromDigest(items: SeasonalSlaDigest[]): StrictCsatQuota[] {
  const out: StrictCsatQuota[] = [];
  for (const item of items) {
    const derived = newStrictCsatQuota(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateStrictCsatQuota(item: StrictCsatQuota): string {
  return normalizeSlaBatchCode(item.code);
}
