import { CohortManifest } from "../../cohort/baseline/cohort-manifest.js";
import { classifyCohortVariance } from "../../cohort/baseline/cohort-variance-policy.js";
import { RetentionTier, newRetentionTier } from "./retention-tier.js";

export function summarizeCohortManifestsForTier(items: CohortManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveRetentionTiersFromManifest(items: CohortManifest[]): RetentionTier[] {
  const out: RetentionTier[] = [];
  for (const item of items) {
    const derived = newRetentionTier(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeRetentionTier(item: RetentionTier): string {
  return classifyCohortVariance(item.effectiveTotal());
}
