import { DomainLedger } from "../../domain/target/domain-ledger.js";
import { domainVarianceWeight } from "../../domain/target/domain-variance-policy.js";
import { CappedWarmupReview, newCappedWarmupReview } from "./capped-warmup-review.js";

export function summarizeDomainLedgersForReview(items: DomainLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveCappedWarmupReviewsFromLedger(items: DomainLedger[]): CappedWarmupReview[] {
  const out: CappedWarmupReview[] = [];
  for (const item of items) {
    const derived = newCappedWarmupReview(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveCappedWarmupReview(item: CappedWarmupReview): number {
  return domainVarianceWeight(5, true);
}
