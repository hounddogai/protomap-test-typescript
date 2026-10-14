import { classifyGlobalApprovalAudit } from "../../approval/override-item/global-approval-audit-policy.js";
import { LenientApprovalCheckpoint } from "../../approval/override-item/lenient-approval-checkpoint.js";
import { FallbackMentionReview, newFallbackMentionReview } from "./fallback-mention-review.js";

export function summarizeLenientApprovalCheckpointsForReview(items: LenientApprovalCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveFallbackMentionReviewsFromCheckpoint(items: LenientApprovalCheckpoint[]): FallbackMentionReview[] {
  const out: FallbackMentionReview[] = [];
  for (const item of items) {
    const derived = newFallbackMentionReview(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function rankFallbackMentionReview(item: FallbackMentionReview): string {
  return classifyGlobalApprovalAudit(item.measuredValue());
}
