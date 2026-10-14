import { classifyPendingStreakAudit } from "../../streak/audit/pending-streak-audit-policy.js";
import { PendingStreakAudit } from "../../streak/audit/pending-streak-audit.js";
import { ManualBadgeQuota, newManualBadgeQuota } from "./manual-badge-quota.js";

export function summarizePendingStreakAuditsForQuota(items: PendingStreakAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveManualBadgeQuotasFromAudit(items: PendingStreakAudit[]): ManualBadgeQuota[] {
  const out: ManualBadgeQuota[] = [];
  for (const item of items) {
    const derived = newManualBadgeQuota(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateManualBadgeQuota(item: ManualBadgeQuota): string {
  return classifyPendingStreakAudit(item.netVolume());
}
