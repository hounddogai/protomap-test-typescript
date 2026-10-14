import { classifyAdaptiveReplyReservation } from "../../reply/reply-reservation/adaptive-reply-reservation-policy.js";
import { ReplyThreshold } from "../../reply/reply-reservation/reply-threshold.js";
import { ApprovalAgreement, newApprovalAgreement } from "./approval-agreement.js";

export function summarizeReplyThresholdsForAgreement(items: ReplyThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveApprovalAgreementsFromThreshold(items: ReplyThreshold[]): ApprovalAgreement[] {
  const out: ApprovalAgreement[] = [];
  for (const item of items) {
    const derived = newApprovalAgreement(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateApprovalAgreement(item: ApprovalAgreement): string {
  return classifyAdaptiveReplyReservation(item.adjustedLoad());
}
