import { normalizeBounceReviewCode } from "../../bounce/bounce-reservation/bounce-review-policy.js";
import { BounceReview } from "../../bounce/bounce-reservation/bounce-review.js";
import { TieredReputationRecord, newTieredReputationRecord } from "./tiered-reputation-record.js";

export function summarizeBounceReviewsForRecord(items: BounceReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveTieredReputationRecordsFromReview(items: BounceReview[]): TieredReputationRecord[] {
  const out: TieredReputationRecord[] = [];
  for (const item of items) {
    const derived = newTieredReputationRecord(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function applyTieredReputationRecord(item: TieredReputationRecord): string {
  return normalizeBounceReviewCode(item.code);
}
