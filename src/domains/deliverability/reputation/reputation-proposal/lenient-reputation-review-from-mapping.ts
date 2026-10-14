import { AdaptiveWarmupMapping } from "../../warmup/warmup-manifest/adaptive-warmup-mapping.js";
import { normalizeFallbackWarmupManifestCode } from "../../warmup/warmup-manifest/fallback-warmup-manifest-policy.js";
import { LenientReputationReview, newLenientReputationReview } from "./lenient-reputation-review.js";

export function summarizeAdaptiveWarmupMappingsForReview(items: AdaptiveWarmupMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLenientReputationReviewsFromMapping(items: AdaptiveWarmupMapping[]): LenientReputationReview[] {
  const out: LenientReputationReview[] = [];
  for (const item of items) {
    const derived = newLenientReputationReview(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function projectLenientReputationReview(item: LenientReputationReview): string {
  return normalizeFallbackWarmupManifestCode(item.code);
}
