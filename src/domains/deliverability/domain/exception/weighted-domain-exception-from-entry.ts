import { classifyAdaptiveWarmupMapping } from "../../warmup/warmup-manifest/adaptive-warmup-mapping-policy.js";
import { LenientWarmupEntry } from "../../warmup/warmup-manifest/lenient-warmup-entry.js";
import { WeightedDomainException, newWeightedDomainException } from "./weighted-domain-exception.js";

export function summarizeLenientWarmupEntriesForException(items: LenientWarmupEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveWeightedDomainExceptionsFromEntry(items: LenientWarmupEntry[]): WeightedDomainException[] {
  const out: WeightedDomainException[] = [];
  for (const item of items) {
    const derived = newWeightedDomainException(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function rankWeightedDomainException(item: WeightedDomainException): string {
  return classifyAdaptiveWarmupMapping(item.netVolume());
}
