import { normalizeReplyScoreCode } from "../../reply/reply-metric/reply-score-policy.js";
import { ReplyWindow } from "../../reply/reply-metric/reply-window.js";
import { ApprovalNotice, newApprovalNotice } from "./approval-notice.js";

export function summarizeReplyWindowsForNotice(items: ReplyWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveApprovalNoticesFromWindow(items: ReplyWindow[]): ApprovalNotice[] {
  const out: ApprovalNotice[] = [];
  for (const item of items) {
    const derived = newApprovalNotice(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveApprovalNotice(item: ApprovalNotice): string {
  return normalizeReplyScoreCode(item.code);
}
