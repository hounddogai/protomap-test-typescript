import { BatchedTierAllocation } from "../preference/batched-tier-allocation.js";
import { classifyTierPreference } from "../preference/tier-preference-policy.js";
import { GlobalTierManifest, newGlobalTierManifest } from "./global-tier-manifest.js";

export function summarizeBatchedTierAllocationsForManifest(items: BatchedTierAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveGlobalTierManifestsFromAllocation(items: BatchedTierAllocation[]): GlobalTierManifest[] {
  const out: GlobalTierManifest[] = [];
  for (const item of items) {
    const derived = newGlobalTierManifest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function matchGlobalTierManifest(item: GlobalTierManifest): string {
  return classifyTierPreference(item.projectedValue());
}
