import { regionalReplyDraftBucket } from "../../reply/reply-draft/regional-reply-draft-policy.js";
import { RegionalReplyDraft } from "../../reply/reply-draft/regional-reply-draft.js";
import { FallbackApprovalQuota, newFallbackApprovalQuota } from "./fallback-approval-quota.js";

export function summarizeRegionalReplyDraftsForQuota(items: RegionalReplyDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveFallbackApprovalQuotasFromDraft(items: RegionalReplyDraft[]): FallbackApprovalQuota[] {
  const out: FallbackApprovalQuota[] = [];
  for (const item of items) {
    const derived = newFallbackApprovalQuota(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceFallbackApprovalQuota(item: FallbackApprovalQuota): string {
  return regionalReplyDraftBucket(item.adjustedVolume());
}
