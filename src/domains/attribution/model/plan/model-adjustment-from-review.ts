import { windowReviewBucket } from "../../window/review/window-review-policy.js";
import { WindowReview } from "../../window/review/window-review.js";
import { ModelAdjustment, newModelAdjustment } from "./model-adjustment.js";

export function summarizeWindowReviewsForAdjustment(items: WindowReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveModelAdjustmentsFromReview(items: WindowReview[]): ModelAdjustment[] {
  const out: ModelAdjustment[] = [];
  for (const item of items) {
    const derived = newModelAdjustment(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeModelAdjustment(item: ModelAdjustment): string {
  return windowReviewBucket(item.measuredValue());
}
