import { manualApprovalDraftWeight } from "../../approval/summary/manual-approval-draft-policy.js";
import { PrimaryApprovalSummary } from "../../approval/summary/primary-approval-summary.js";
import { FallbackMentionAdjustment, newFallbackMentionAdjustment } from "./fallback-mention-adjustment.js";

export function summarizePrimaryApprovalSummariesForAdjustment(items: PrimaryApprovalSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveFallbackMentionAdjustmentsFromSummary(items: PrimaryApprovalSummary[]): FallbackMentionAdjustment[] {
  const out: FallbackMentionAdjustment[] = [];
  for (const item of items) {
    const derived = newFallbackMentionAdjustment(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignFallbackMentionAdjustment(item: FallbackMentionAdjustment): number {
  return manualApprovalDraftWeight(5, true);
}
