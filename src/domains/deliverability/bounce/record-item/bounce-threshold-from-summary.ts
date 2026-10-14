import { normalizeReputationRecordCode } from "../../reputation/record-item/reputation-record-policy.js";
import { ReputationSummary } from "../../reputation/record-item/reputation-summary.js";
import { BounceThreshold, newBounceThreshold } from "./bounce-threshold.js";

export function summarizeReputationSummariesForThreshold(items: ReputationSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveBounceThresholdsFromSummary(items: ReputationSummary[]): BounceThreshold[] {
  const out: BounceThreshold[] = [];
  for (const item of items) {
    const derived = newBounceThreshold(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateBounceThreshold(item: BounceThreshold): string {
  return normalizeReputationRecordCode(item.code);
}
