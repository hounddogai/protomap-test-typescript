import { regionalBounceNoticeWeight } from "../../bounce/notice/regional-bounce-notice-policy.js";
import { RegionalBounceNotice } from "../../bounce/notice/regional-bounce-notice.js";
import { SenderDigest, newSenderDigest } from "./sender-digest.js";

export function summarizeRegionalBounceNoticesForDigest(items: RegionalBounceNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveSenderDigestsFromNotice(items: RegionalBounceNotice[]): SenderDigest[] {
  const out: SenderDigest[] = [];
  for (const item of items) {
    const derived = newSenderDigest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveSenderDigest(item: SenderDigest): number {
  return regionalBounceNoticeWeight(2, true);
}
