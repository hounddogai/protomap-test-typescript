import { fallbackInsightSummaryWeight } from "../../insight/summary/fallback-insight-summary-policy.js";
import { PrimaryInsightProfile } from "../../insight/summary/primary-insight-profile.js";
import { StrictQueueScore, newStrictQueueScore } from "./strict-queue-score.js";

export function summarizePrimaryInsightProfilesForScore(items: PrimaryInsightProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveStrictQueueScoresFromProfile(items: PrimaryInsightProfile[]): StrictQueueScore[] {
  const out: StrictQueueScore[] = [];
  for (const item of items) {
    const derived = newStrictQueueScore(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function settleStrictQueueScore(item: StrictQueueScore): number {
  return fallbackInsightSummaryWeight(3, true);
}
