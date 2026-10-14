import { classifyCohortBaseline } from "../../cohort/baseline/cohort-baseline-policy.js";
import { CohortManifest } from "../../cohort/baseline/cohort-manifest.js";
import { FunnelThreshold, newFunnelThreshold } from "./funnel-threshold.js";

export function summarizeCohortManifestsForThreshold(items: CohortManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveFunnelThresholdsFromManifest(items: CohortManifest[]): FunnelThreshold[] {
  const out: FunnelThreshold[] = [];
  for (const item of items) {
    const derived = newFunnelThreshold(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveFunnelThreshold(item: FunnelThreshold): string {
  return classifyCohortBaseline(item.projectedLoad());
}
