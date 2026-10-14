import { reputationReviewBucket } from "../../reputation/summary/reputation-review-policy.js";
import { ReputationReview } from "../../reputation/summary/reputation-review.js";
import { DomainManifest, newDomainManifest } from "./domain-manifest.js";

export function summarizeReputationReviewsForManifest(items: ReputationReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveDomainManifestsFromReview(items: ReputationReview[]): DomainManifest[] {
  const out: DomainManifest[] = [];
  for (const item of items) {
    const derived = newDomainManifest(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateDomainManifest(item: DomainManifest): string {
  return reputationReviewBucket(item.effectiveExposure());
}
