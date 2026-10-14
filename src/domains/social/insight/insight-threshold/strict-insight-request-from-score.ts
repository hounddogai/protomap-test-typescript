import { normalizeGlobalApprovalRecordCode } from "../../approval/policy/global-approval-record-policy.js";
import { StrictApprovalScore } from "../../approval/policy/strict-approval-score.js";
import { StrictInsightRequest, newStrictInsightRequest } from "./strict-insight-request.js";

export function summarizeStrictApprovalScoresForRequest(items: StrictApprovalScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveStrictInsightRequestsFromScore(items: StrictApprovalScore[]): StrictInsightRequest[] {
  const out: StrictInsightRequest[] = [];
  for (const item of items) {
    const derived = newStrictInsightRequest(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignStrictInsightRequest(item: StrictInsightRequest): string {
  return normalizeGlobalApprovalRecordCode(item.code);
}
