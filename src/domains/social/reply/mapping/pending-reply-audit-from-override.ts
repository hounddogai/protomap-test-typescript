import { insightForecastBucket } from "../../insight/profile/insight-forecast-policy.js";
import { ManualInsightOverride } from "../../insight/profile/manual-insight-override.js";
import { PendingReplyAudit, newPendingReplyAudit } from "./pending-reply-audit.js";

export function summarizeManualInsightOverridesForAudit(items: ManualInsightOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function derivePendingReplyAuditsFromOverride(items: ManualInsightOverride[]): PendingReplyAudit[] {
  const out: PendingReplyAudit[] = [];
  for (const item of items) {
    const derived = newPendingReplyAudit(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function scorePendingReplyAudit(item: PendingReplyAudit): string {
  return insightForecastBucket(item.measuredValue());
}
