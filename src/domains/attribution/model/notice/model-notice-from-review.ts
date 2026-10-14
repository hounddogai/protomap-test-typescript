import { CreditReview } from "../../credit/review/credit-review.js";
import { normalizeCreditTemplateCode } from "../../credit/review/credit-template-policy.js";
import { ModelNotice, newModelNotice } from "./model-notice.js";

export function summarizeCreditReviewsForNotice(items: CreditReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveModelNoticesFromReview(items: CreditReview[]): ModelNotice[] {
  const out: ModelNotice[] = [];
  for (const item of items) {
    const derived = newModelNotice(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateModelNotice(item: ModelNotice): string {
  return normalizeCreditTemplateCode(item.code);
}
