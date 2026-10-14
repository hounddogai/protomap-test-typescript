import { ManualTierManifest } from "../allocation/manual-tier-manifest.js";
import { tierWindowBucket } from "../allocation/tier-window-policy.js";
import { ManualTierAllocation, newManualTierAllocation } from "./manual-tier-allocation.js";

export function summarizeManualTierManifestsForAllocation(items: ManualTierManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveManualTierAllocationsFromManifest(items: ManualTierManifest[]): ManualTierAllocation[] {
  const out: ManualTierAllocation[] = [];
  for (const item of items) {
    const derived = newManualTierAllocation(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeManualTierAllocation(item: ManualTierAllocation): string {
  return tierWindowBucket(item.effectiveValue());
}
