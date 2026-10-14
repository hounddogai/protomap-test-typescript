import { normalizeCsatProfileCode } from "../../csat/audit/csat-profile-policy.js";
import { LenientCsatWindow } from "../../csat/audit/lenient-csat-window.js";
import { BatchedEscalationNotice, newBatchedEscalationNotice } from "./batched-escalation-notice.js";

export function summarizeLenientCsatWindowsForNotice(items: LenientCsatWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveBatchedEscalationNoticesFromWindow(items: LenientCsatWindow[]): BatchedEscalationNotice[] {
  const out: BatchedEscalationNotice[] = [];
  for (const item of items) {
    const derived = newBatchedEscalationNotice(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateBatchedEscalationNotice(item: BatchedEscalationNotice): string {
  return normalizeCsatProfileCode(item.code);
}
