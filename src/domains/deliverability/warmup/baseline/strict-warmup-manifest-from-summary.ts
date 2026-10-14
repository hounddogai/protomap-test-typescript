import { RollingDomainSummary } from "../../domain/policy/rolling-domain-summary.js";
import { classifyWeightedDomainBundle } from "../../domain/policy/weighted-domain-bundle-policy.js";
import { StrictWarmupManifest, newStrictWarmupManifest } from "./strict-warmup-manifest.js";

export function summarizeRollingDomainSummariesForManifest(items: RollingDomainSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveStrictWarmupManifestsFromSummary(items: RollingDomainSummary[]): StrictWarmupManifest[] {
  const out: StrictWarmupManifest[] = [];
  for (const item of items) {
    const derived = newStrictWarmupManifest(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeStrictWarmupManifest(item: StrictWarmupManifest): string {
  return classifyWeightedDomainBundle(item.netExposure());
}
