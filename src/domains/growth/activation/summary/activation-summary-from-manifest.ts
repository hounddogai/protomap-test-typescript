import { cohortForecastBucket } from "../../cohort/baseline/cohort-forecast-policy.js";
import { CohortManifest } from "../../cohort/baseline/cohort-manifest.js";
import { ActivationSummary, newActivationSummary } from "./activation-summary.js";

export function summarizeCohortManifestsForSummary(items: CohortManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveActivationSummariesFromManifest(items: CohortManifest[]): ActivationSummary[] {
  const out: ActivationSummary[] = [];
  for (const item of items) {
    const derived = newActivationSummary(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveActivationSummary(item: ActivationSummary): string {
  return cohortForecastBucket(item.adjustedValue());
}
