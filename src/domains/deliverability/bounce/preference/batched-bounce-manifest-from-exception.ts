import { DefaultWarmupException } from "../../warmup/override-item/default-warmup-exception.js";
import { defaultWarmupOverrideWeight } from "../../warmup/override-item/default-warmup-override-policy.js";
import { BatchedBounceManifest, newBatchedBounceManifest } from "./batched-bounce-manifest.js";

export function summarizeDefaultWarmupExceptionsForManifest(items: DefaultWarmupException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveBatchedBounceManifestsFromException(items: DefaultWarmupException[]): BatchedBounceManifest[] {
  const out: BatchedBounceManifest[] = [];
  for (const item of items) {
    const derived = newBatchedBounceManifest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeBatchedBounceManifest(item: BatchedBounceManifest): number {
  return defaultWarmupOverrideWeight(3, true);
}
