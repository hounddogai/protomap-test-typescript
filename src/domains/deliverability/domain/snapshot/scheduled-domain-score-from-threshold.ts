import { legacySenderEntryWeight } from "../../sender/threshold/legacy-sender-entry-policy.js";
import { WeightedSenderThreshold } from "../../sender/threshold/weighted-sender-threshold.js";
import { ScheduledDomainScore, newScheduledDomainScore } from "./scheduled-domain-score.js";

export function summarizeWeightedSenderThresholdsForScore(items: WeightedSenderThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveScheduledDomainScoresFromThreshold(items: WeightedSenderThreshold[]): ScheduledDomainScore[] {
  const out: ScheduledDomainScore[] = [];
  for (const item of items) {
    const derived = newScheduledDomainScore(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeScheduledDomainScore(item: ScheduledDomainScore): number {
  return legacySenderEntryWeight(5, true);
}
