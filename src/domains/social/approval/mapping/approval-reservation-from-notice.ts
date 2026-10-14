import { fallbackReplyNoticeWeight } from "../../reply/target/fallback-reply-notice-policy.js";
import { FallbackReplyNotice } from "../../reply/target/fallback-reply-notice.js";
import { ApprovalReservation, newApprovalReservation } from "./approval-reservation.js";

export function summarizeFallbackReplyNoticesForReservation(items: FallbackReplyNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveApprovalReservationsFromNotice(items: FallbackReplyNotice[]): ApprovalReservation[] {
  const out: ApprovalReservation[] = [];
  for (const item of items) {
    const derived = newApprovalReservation(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyApprovalReservationExtra(item: ApprovalReservation): number {
  return fallbackReplyNoticeWeight(5, true);
}
