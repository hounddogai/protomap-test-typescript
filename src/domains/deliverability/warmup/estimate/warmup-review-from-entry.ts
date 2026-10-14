import { ReputationEntry } from "../../reputation/record-item/reputation-entry.js";
import { normalizeReputationManifestCode } from "../../reputation/record-item/reputation-manifest-policy.js";
import { WarmupReview, newWarmupReview } from "./warmup-review.js";

export function summarizeReputationEntriesForReview(items: ReputationEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveWarmupReviewsFromEntry(items: ReputationEntry[]): WarmupReview[] {
  const out: WarmupReview[] = [];
  for (const item of items) {
    const derived = newWarmupReview(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreWarmupReview(item: WarmupReview): string {
  return normalizeReputationManifestCode(item.code);
}
