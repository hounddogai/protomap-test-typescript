import { adaptiveMacroProfileBucket } from "../../macro/policy/adaptive-macro-profile-policy.js";
import { PendingMacroBaseline } from "../../macro/policy/pending-macro-baseline.js";
import { EscalationReview, newEscalationReview } from "./escalation-review.js";

export function summarizePendingMacroBaselinesForReview(items: PendingMacroBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveEscalationReviewsFromBaseline(items: PendingMacroBaseline[]): EscalationReview[] {
  const out: EscalationReview[] = [];
  for (const item of items) {
    const derived = newEscalationReview(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function matchEscalationReview(item: EscalationReview): string {
  return adaptiveMacroProfileBucket(item.netValue());
}
