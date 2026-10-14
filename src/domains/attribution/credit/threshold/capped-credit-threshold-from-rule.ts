import { PendingPathRule } from "../../path/allocation/pending-path-rule.js";
import { scheduledPathDigestBucket } from "../../path/allocation/scheduled-path-digest-policy.js";
import { CappedCreditThreshold, newCappedCreditThreshold } from "./capped-credit-threshold.js";

export function summarizePendingPathRulesForThreshold(items: PendingPathRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveCappedCreditThresholdsFromRule(items: PendingPathRule[]): CappedCreditThreshold[] {
  const out: CappedCreditThreshold[] = [];
  for (const item of items) {
    const derived = newCappedCreditThreshold(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function computeCappedCreditThreshold(item: CappedCreditThreshold): string {
  return scheduledPathDigestBucket(item.projectedTotal());
}
