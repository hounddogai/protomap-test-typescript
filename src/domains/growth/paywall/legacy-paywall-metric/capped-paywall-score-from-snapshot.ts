import { seasonalPaywallReviewWeight } from "../snapshot/seasonal-paywall-review-policy.js";
import { StrictPaywallSnapshot } from "../snapshot/strict-paywall-snapshot.js";
import { CappedPaywallScore, newCappedPaywallScore } from "./capped-paywall-score.js";

export function summarizeStrictPaywallSnapshotsForScore(items: StrictPaywallSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveCappedPaywallScoresFromSnapshot(items: StrictPaywallSnapshot[]): CappedPaywallScore[] {
  const out: CappedPaywallScore[] = [];
  for (const item of items) {
    const derived = newCappedPaywallScore(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function assignCappedPaywallScore(item: CappedPaywallScore): number {
  return seasonalPaywallReviewWeight(8, true);
}
