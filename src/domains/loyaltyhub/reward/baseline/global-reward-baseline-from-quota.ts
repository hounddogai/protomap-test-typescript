import { manualBadgeQuotaBucket } from "../../badge/audit/manual-badge-quota-policy.js";
import { ManualBadgeQuota } from "../../badge/audit/manual-badge-quota.js";
import { GlobalRewardBaseline, newGlobalRewardBaseline } from "./global-reward-baseline.js";

export function summarizeManualBadgeQuotasForBaseline(items: ManualBadgeQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveGlobalRewardBaselinesFromQuota(items: ManualBadgeQuota[]): GlobalRewardBaseline[] {
  const out: GlobalRewardBaseline[] = [];
  for (const item of items) {
    const derived = newGlobalRewardBaseline(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreGlobalRewardBaseline(item: GlobalRewardBaseline): string {
  return manualBadgeQuotaBucket(item.measuredValue());
}
