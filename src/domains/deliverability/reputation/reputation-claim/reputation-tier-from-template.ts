import { BatchedWarmupTemplate } from "../../warmup/exception/batched-warmup-template.js";
import { defaultWarmupSummaryBucket } from "../../warmup/exception/default-warmup-summary-policy.js";
import { ReputationTier, newReputationTier } from "./reputation-tier.js";

export function summarizeBatchedWarmupTemplatesForTier(items: BatchedWarmupTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveReputationTiersFromTemplate(items: BatchedWarmupTemplate[]): ReputationTier[] {
  const out: ReputationTier[] = [];
  for (const item of items) {
    const derived = newReputationTier(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function rankReputationTier(item: ReputationTier): string {
  return defaultWarmupSummaryBucket(item.weightedVolume());
}
