import { normalizeTieredReplyNoticeCode } from "../../reply/reply-variance/tiered-reply-notice-policy.js";
import { TieredReplyNotice } from "../../reply/reply-variance/tiered-reply-notice.js";
import { GlobalQueueAgreement, newGlobalQueueAgreement } from "./global-queue-agreement.js";

export function summarizeTieredReplyNoticesForAgreement(items: TieredReplyNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveGlobalQueueAgreementsFromNotice(items: TieredReplyNotice[]): GlobalQueueAgreement[] {
  const out: GlobalQueueAgreement[] = [];
  for (const item of items) {
    const derived = newGlobalQueueAgreement(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeGlobalQueueAgreement(item: GlobalQueueAgreement): string {
  return normalizeTieredReplyNoticeCode(item.code);
}
