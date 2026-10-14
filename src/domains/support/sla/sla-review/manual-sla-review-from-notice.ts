import {
  normalizeScheduledEscalationNoticeCode,
} from "../../escalation/lenient-escalation-notice/scheduled-escalation-notice-policy.js";
import { ScheduledEscalationNotice } from "../../escalation/lenient-escalation-notice/scheduled-escalation-notice.js";
import { ManualSlaReview, newManualSlaReview } from "./manual-sla-review.js";

export function summarizeScheduledEscalationNoticesForReview(items: ScheduledEscalationNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveManualSlaReviewsFromNotice(items: ScheduledEscalationNotice[]): ManualSlaReview[] {
  const out: ManualSlaReview[] = [];
  for (const item of items) {
    const derived = newManualSlaReview(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectManualSlaReview(item: ManualSlaReview): string {
  return normalizeScheduledEscalationNoticeCode(item.code);
}
