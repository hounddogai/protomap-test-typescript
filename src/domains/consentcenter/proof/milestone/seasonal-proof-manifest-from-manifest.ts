import { classifyFallbackSuppressionGroup } from "../../suppression/group/fallback-suppression-group-policy.js";
import { RegionalSuppressionManifest } from "../../suppression/group/regional-suppression-manifest.js";
import { SeasonalProofManifest, newSeasonalProofManifest } from "./seasonal-proof-manifest.js";

export function summarizeRegionalSuppressionManifestsForManifest(items: RegionalSuppressionManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveSeasonalProofManifestsFromManifest(items: RegionalSuppressionManifest[]): SeasonalProofManifest[] {
  const out: SeasonalProofManifest[] = [];
  for (const item of items) {
    const derived = newSeasonalProofManifest(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceSeasonalProofManifest(item: SeasonalProofManifest): string {
  return classifyFallbackSuppressionGroup(item.effectiveExposure());
}
