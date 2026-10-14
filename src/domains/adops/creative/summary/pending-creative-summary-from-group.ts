import { adaptiveCreativeQuotaWeight } from "../creative-notice/adaptive-creative-quota-policy.js";
import { LegacyCreativeGroup } from "../creative-notice/legacy-creative-group.js";
import { PendingCreativeSummary, newPendingCreativeSummary } from "./pending-creative-summary.js";

export function summarizeLegacyCreativeGroupsForSummary(items: LegacyCreativeGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function derivePendingCreativeSummariesFromGroup(items: LegacyCreativeGroup[]): PendingCreativeSummary[] {
  const out: PendingCreativeSummary[] = [];
  for (const item of items) {
    const derived = newPendingCreativeSummary(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function assignPendingCreativeSummary(item: PendingCreativeSummary): number {
  return adaptiveCreativeQuotaWeight(2, true);
}
