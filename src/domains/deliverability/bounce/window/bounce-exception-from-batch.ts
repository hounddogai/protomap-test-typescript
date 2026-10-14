import { WarmupBatch } from "../../warmup/batch/warmup-batch.js";
import { warmupBundleWeight } from "../../warmup/batch/warmup-bundle-policy.js";
import { BounceException, newBounceException } from "./bounce-exception.js";

export function summarizeWarmupBatchesForException(items: WarmupBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveBounceExceptionsFromBatch(items: WarmupBatch[]): BounceException[] {
  const out: BounceException[] = [];
  for (const item of items) {
    const derived = newBounceException(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function splitBounceException(item: BounceException): number {
  return warmupBundleWeight(9, true);
}
