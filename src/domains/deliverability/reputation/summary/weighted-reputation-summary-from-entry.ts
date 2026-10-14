import { PendingSenderEntry } from "../../sender/exception/pending-sender-entry.js";
import { normalizeSenderNoticeCode } from "../../sender/exception/sender-notice-policy.js";
import { WeightedReputationSummary, newWeightedReputationSummary } from "./weighted-reputation-summary.js";

export function summarizePendingSenderEntriesForSummary(items: PendingSenderEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveWeightedReputationSummariesFromEntry(items: PendingSenderEntry[]): WeightedReputationSummary[] {
  const out: WeightedReputationSummary[] = [];
  for (const item of items) {
    const derived = newWeightedReputationSummary(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignWeightedReputationSummary(item: WeightedReputationSummary): string {
  return normalizeSenderNoticeCode(item.code);
}
