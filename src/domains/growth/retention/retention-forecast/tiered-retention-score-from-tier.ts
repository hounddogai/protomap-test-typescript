import { classifyGlobalRetentionTier } from "../slot/global-retention-tier-policy.js";
import { GlobalRetentionTier } from "../slot/global-retention-tier.js";
import { TieredRetentionScore, newTieredRetentionScore } from "./tiered-retention-score.js";

export function summarizeGlobalRetentionTiersForScore(items: GlobalRetentionTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveTieredRetentionScoresFromTier(items: GlobalRetentionTier[]): TieredRetentionScore[] {
  const out: TieredRetentionScore[] = [];
  for (const item of items) {
    const derived = newTieredRetentionScore(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function assignTieredRetentionScore(item: TieredRetentionScore): string {
  return classifyGlobalRetentionTier(item.weightedVolume());
}
