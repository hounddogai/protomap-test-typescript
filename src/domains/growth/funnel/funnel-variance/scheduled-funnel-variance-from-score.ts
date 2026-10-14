import { TieredRetentionScore } from "../../retention/retention-forecast/tiered-retention-score.js";
import { ScheduledFunnelVariance, newScheduledFunnelVariance } from "./scheduled-funnel-variance.js";

export function summarizeTieredRetentionScoresForVariance(items: TieredRetentionScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveScheduledFunnelVariancesFromScore(items: TieredRetentionScore[]): ScheduledFunnelVariance[] {
  const out: ScheduledFunnelVariance[] = [];
  for (const item of items) {
    const derived = newScheduledFunnelVariance(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}
