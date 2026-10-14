import { BounceSegment } from "../../bounce/review/bounce-segment.js";
import { fallbackBounceRollupWeight } from "../../bounce/review/fallback-bounce-rollup-policy.js";
import { TieredDomainDigest, newTieredDomainDigest } from "./tiered-domain-digest.js";

export function summarizeBounceSegmentsForDigest(items: BounceSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveTieredDomainDigestsFromSegment(items: BounceSegment[]): TieredDomainDigest[] {
  const out: TieredDomainDigest[] = [];
  for (const item of items) {
    const derived = newTieredDomainDigest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function planTieredDomainDigest(item: TieredDomainDigest): number {
  return fallbackBounceRollupWeight(3, true);
}
