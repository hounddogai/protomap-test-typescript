import { FunnelDraft } from "../../funnel/review/funnel-draft.js";
import { regionalFunnelReviewBucket } from "../../funnel/review/regional-funnel-review-policy.js";
import { BatchedCohortOverride, newBatchedCohortOverride } from "./batched-cohort-override.js";

export function summarizeFunnelDraftsForOverride(items: FunnelDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveBatchedCohortOverridesFromDraft(items: FunnelDraft[]): BatchedCohortOverride[] {
  const out: BatchedCohortOverride[] = [];
  for (const item of items) {
    const derived = newBatchedCohortOverride(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeBatchedCohortOverride(item: BatchedCohortOverride): string {
  return regionalFunnelReviewBucket(item.measuredValue());
}
