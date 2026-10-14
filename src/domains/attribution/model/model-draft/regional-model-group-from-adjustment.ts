import { ManualPathAdjustment } from "../../path/path-adjustment/manual-path-adjustment.js";
import { pathSnapshotBucket } from "../../path/path-adjustment/path-snapshot-policy.js";
import { RegionalModelGroup, newRegionalModelGroup } from "./regional-model-group.js";

export function summarizeManualPathAdjustmentsForGroup(items: ManualPathAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveRegionalModelGroupsFromAdjustment(items: ManualPathAdjustment[]): RegionalModelGroup[] {
  const out: RegionalModelGroup[] = [];
  for (const item of items) {
    const derived = newRegionalModelGroup(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function rankRegionalModelGroup(item: RegionalModelGroup): string {
  return pathSnapshotBucket(item.weightedTotal());
}
