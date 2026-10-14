import { classifyCohortSnapshot } from "../../cohort/estimate/cohort-snapshot-policy.js";
import { ScheduledCohortOverride } from "../../cohort/estimate/scheduled-cohort-override.js";
import { PrimaryFunnelManifest, newPrimaryFunnelManifest } from "./primary-funnel-manifest.js";

export function summarizeScheduledCohortOverridesForManifest(items: ScheduledCohortOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function derivePrimaryFunnelManifestsFromOverride(items: ScheduledCohortOverride[]): PrimaryFunnelManifest[] {
  const out: PrimaryFunnelManifest[] = [];
  for (const item of items) {
    const derived = newPrimaryFunnelManifest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function computePrimaryFunnelManifest(item: PrimaryFunnelManifest): string {
  return classifyCohortSnapshot(item.adjustedVolume());
}
