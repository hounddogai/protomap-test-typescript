import { ChallengeSnapshot } from "../../challenge/template/challenge-snapshot.js";
import { challengeTemplateWeight } from "../../challenge/template/challenge-template-policy.js";
import { RedemptionMetric, newRedemptionMetric } from "./redemption-metric.js";

export function summarizeChallengeSnapshotsForMetric(items: ChallengeSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRedemptionMetricsFromSnapshot(items: ChallengeSnapshot[]): RedemptionMetric[] {
  const out: RedemptionMetric[] = [];
  for (const item of items) {
    const derived = newRedemptionMetric(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceRedemptionMetric(item: RedemptionMetric): number {
  return challengeTemplateWeight(4, true);
}
