import { classifyCappedMacroEstimate } from "../../macro/policy/capped-macro-estimate-policy.js";
import { PendingMacroBaseline } from "../../macro/policy/pending-macro-baseline.js";
import { LegacyCsatQuota, newLegacyCsatQuota } from "./legacy-csat-quota.js";

export function summarizePendingMacroBaselinesForQuota(items: PendingMacroBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveLegacyCsatQuotasFromBaseline(items: PendingMacroBaseline[]): LegacyCsatQuota[] {
  const out: LegacyCsatQuota[] = [];
  for (const item of items) {
    const derived = newLegacyCsatQuota(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function projectLegacyCsatQuota(item: LegacyCsatQuota): string {
  return classifyCappedMacroEstimate(item.projectedTotal());
}
