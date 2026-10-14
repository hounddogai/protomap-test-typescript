import { PrimaryWarmupTier } from "../../warmup/manifest/primary-warmup-tier.js";
import { seasonalWarmupBatchBucket } from "../../warmup/manifest/seasonal-warmup-batch-policy.js";
import { RollingDomainManifest, newRollingDomainManifest } from "./rolling-domain-manifest.js";

export function summarizePrimaryWarmupTiersForManifest(items: PrimaryWarmupTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveRollingDomainManifestsFromTier(items: PrimaryWarmupTier[]): RollingDomainManifest[] {
  const out: RollingDomainManifest[] = [];
  for (const item of items) {
    const derived = newRollingDomainManifest(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveRollingDomainManifest(item: RollingDomainManifest): string {
  return seasonalWarmupBatchBucket(item.weightedExposure());
}
