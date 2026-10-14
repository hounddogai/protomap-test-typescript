import { classifyGlobalProofDigest } from "../../proof/adjustment/global-proof-digest-policy.js";
import { RollingProofTier } from "../../proof/adjustment/rolling-proof-tier.js";
import { FallbackPreferenceForecast, newFallbackPreferenceForecast } from "./fallback-preference-forecast.js";

export function summarizeRollingProofTiersForForecast(items: RollingProofTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveFallbackPreferenceForecastsFromTier(items: RollingProofTier[]): FallbackPreferenceForecast[] {
  const out: FallbackPreferenceForecast[] = [];
  for (const item of items) {
    const derived = newFallbackPreferenceForecast(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveFallbackPreferenceForecast(item: FallbackPreferenceForecast): string {
  return classifyGlobalProofDigest(item.projectedValue());
}
