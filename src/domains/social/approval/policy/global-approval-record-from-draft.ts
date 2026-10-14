import { PrimaryMentionDraft } from "../../mention/record-item/primary-mention-draft.js";
import { classifyRollingMentionRecord } from "../../mention/record-item/rolling-mention-record-policy.js";
import { GlobalApprovalRecord, newGlobalApprovalRecord } from "./global-approval-record.js";

export function summarizePrimaryMentionDraftsForRecord(items: PrimaryMentionDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveGlobalApprovalRecordsFromDraft(items: PrimaryMentionDraft[]): GlobalApprovalRecord[] {
  const out: GlobalApprovalRecord[] = [];
  for (const item of items) {
    const derived = newGlobalApprovalRecord(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileGlobalApprovalRecord(item: GlobalApprovalRecord): string {
  return classifyRollingMentionRecord(item.effectiveTotal());
}
