import { RegionalBounceScore } from "../../bounce/bounce-score/regional-bounce-score.js";
import { classifyTieredBounceDraft } from "../../bounce/bounce-score/tiered-bounce-draft-policy.js";
import { BatchedDomainEntry, newBatchedDomainEntry } from "./batched-domain-entry.js";

export function summarizeRegionalBounceScoresForEntry(items: RegionalBounceScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveBatchedDomainEntriesFromScore(items: RegionalBounceScore[]): BatchedDomainEntry[] {
  const out: BatchedDomainEntry[] = [];
  for (const item of items) {
    const derived = newBatchedDomainEntry(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeBatchedDomainEntry(item: BatchedDomainEntry): string {
  return classifyTieredBounceDraft(item.projectedValue());
}
