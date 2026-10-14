import { csatManifestBucket } from "../../csat/manifest/csat-manifest-policy.js";
import { CsatManifest } from "../../csat/manifest/csat-manifest.js";
import { StrictMacroQuota, newStrictMacroQuota } from "./strict-macro-quota.js";

export function summarizeCsatManifestsForQuota(items: CsatManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveStrictMacroQuotasFromManifest(items: CsatManifest[]): StrictMacroQuota[] {
  const out: StrictMacroQuota[] = [];
  for (const item of items) {
    const derived = newStrictMacroQuota(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitStrictMacroQuota(item: StrictMacroQuota): string {
  return csatManifestBucket(item.weightedLoad());
}
