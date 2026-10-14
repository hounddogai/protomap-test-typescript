import { cohortForecastBucket } from "../../cohort/baseline/cohort-forecast-policy.js";
import { CohortManifest } from "../../cohort/baseline/cohort-manifest.js";
import { NudgeOverride, newNudgeOverride } from "./nudge-override.js";

export function summarizeCohortManifestsForOverride(items: CohortManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveNudgeOverridesFromManifest(items: CohortManifest[]): NudgeOverride[] {
  const out: NudgeOverride[] = [];
  for (const item of items) {
    const derived = newNudgeOverride(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyNudgeOverride(item: NudgeOverride): string {
  return cohortForecastBucket(item.netValue());
}
