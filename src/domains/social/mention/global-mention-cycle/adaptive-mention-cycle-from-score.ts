import { RollingPostScore } from "../../post/metric/rolling-post-score.js";
import { seasonalPostMetricWeight } from "../../post/metric/seasonal-post-metric-policy.js";
import { AdaptiveMentionCycle, newAdaptiveMentionCycle } from "./adaptive-mention-cycle.js";

export function summarizeRollingPostScoresForCycle(items: RollingPostScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveAdaptiveMentionCyclesFromScore(items: RollingPostScore[]): AdaptiveMentionCycle[] {
  const out: AdaptiveMentionCycle[] = [];
  for (const item of items) {
    const derived = newAdaptiveMentionCycle(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeAdaptiveMentionCycle(item: AdaptiveMentionCycle): number {
  return seasonalPostMetricWeight(9, true);
}
