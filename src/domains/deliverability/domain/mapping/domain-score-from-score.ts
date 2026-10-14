import { classifyBounceBundle } from "../../bounce/profile/bounce-bundle-policy.js";
import { BounceScore } from "../../bounce/profile/bounce-score.js";
import { DomainScore, newDomainScore } from "./domain-score.js";

export function summarizeBounceScoresForScore(items: BounceScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveDomainScoresFromScore(items: BounceScore[]): DomainScore[] {
  const out: DomainScore[] = [];
  for (const item of items) {
    const derived = newDomainScore(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeDomainScore(item: DomainScore): string {
  return classifyBounceBundle(item.netValue());
}
