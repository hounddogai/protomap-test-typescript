import { seasonalInsightReviewBucket } from "../insight-snapshot/seasonal-insight-review-policy.js";
import { WeightedInsightSnapshot } from "../insight-snapshot/weighted-insight-snapshot.js";
import { PendingInsightAgreement, newPendingInsightAgreement } from "./pending-insight-agreement.js";

export function summarizeWeightedInsightSnapshotsForAgreement(items: WeightedInsightSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function derivePendingInsightAgreementsFromSnapshot(items: WeightedInsightSnapshot[]): PendingInsightAgreement[] {
  const out: PendingInsightAgreement[] = [];
  for (const item of items) {
    const derived = newPendingInsightAgreement(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settlePendingInsightAgreement(item: PendingInsightAgreement): string {
  return seasonalInsightReviewBucket(item.effectiveLoad());
}
