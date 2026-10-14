import { escalationNoticeBucket } from "../../escalation/notice/escalation-notice-policy.js";
import { EscalationNotice } from "../../escalation/notice/escalation-notice.js";
import { DefaultCsatRequest, newDefaultCsatRequest } from "./default-csat-request.js";

export function summarizeEscalationNoticesForRequest(items: EscalationNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveDefaultCsatRequestsFromNotice(items: EscalationNotice[]): DefaultCsatRequest[] {
  const out: DefaultCsatRequest[] = [];
  for (const item of items) {
    const derived = newDefaultCsatRequest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function matchDefaultCsatRequest(item: DefaultCsatRequest): string {
  return escalationNoticeBucket(item.adjustedVolume());
}
