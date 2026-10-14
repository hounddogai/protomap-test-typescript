import { PendingComplaintMapping } from "../metric/pending-complaint-mapping.js";
import { tieredComplaintBundleBucket } from "../metric/tiered-complaint-bundle-policy.js";
import { RollingComplaintVariance, newRollingComplaintVariance } from "./rolling-complaint-variance.js";

export function summarizePendingComplaintMappingsForVariance(items: PendingComplaintMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveRollingComplaintVariancesFromMapping(items: PendingComplaintMapping[]): RollingComplaintVariance[] {
  const out: RollingComplaintVariance[] = [];
  for (const item of items) {
    const derived = newRollingComplaintVariance(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function applyRollingComplaintVariance(item: RollingComplaintVariance): string {
  return tieredComplaintBundleBucket(item.weightedVolume());
}
