import { BatchedReputationLedger } from "../../reputation/reputation-ledger/batched-reputation-ledger.js";
import { classifyStrictReputationRule } from "../../reputation/reputation-ledger/strict-reputation-rule-policy.js";
import { RegionalBounceScore, newRegionalBounceScore } from "./regional-bounce-score.js";

export function summarizeBatchedReputationLedgersForScore(items: BatchedReputationLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveRegionalBounceScoresFromLedger(items: BatchedReputationLedger[]): RegionalBounceScore[] {
  const out: RegionalBounceScore[] = [];
  for (const item of items) {
    const derived = newRegionalBounceScore(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeRegionalBounceScore(item: RegionalBounceScore): string {
  return classifyStrictReputationRule(item.measuredValue());
}
