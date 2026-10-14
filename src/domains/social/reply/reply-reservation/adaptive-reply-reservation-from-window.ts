import { normalizeApprovalOverrideCode } from "../../approval/draft/approval-override-policy.js";
import { ApprovalWindow } from "../../approval/draft/approval-window.js";
import { AdaptiveReplyReservation, newAdaptiveReplyReservation } from "./adaptive-reply-reservation.js";

export function summarizeApprovalWindowsForReservation(items: ApprovalWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveAdaptiveReplyReservationsFromWindow(items: ApprovalWindow[]): AdaptiveReplyReservation[] {
  const out: AdaptiveReplyReservation[] = [];
  for (const item of items) {
    const derived = newAdaptiveReplyReservation(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeAdaptiveReplyReservation(item: AdaptiveReplyReservation): string {
  return normalizeApprovalOverrideCode(item.code);
}
