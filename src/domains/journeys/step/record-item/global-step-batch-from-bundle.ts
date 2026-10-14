import { WaitBundle } from "../../wait/checkpoint/wait-bundle.js";
import { waitCheckpointBucket } from "../../wait/checkpoint/wait-checkpoint-policy.js";
import { GlobalStepBatch, newGlobalStepBatch } from "./global-step-batch.js";

export function summarizeWaitBundlesForBatch(items: WaitBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveGlobalStepBatchesFromBundle(items: WaitBundle[]): GlobalStepBatch[] {
  const out: GlobalStepBatch[] = [];
  for (const item of items) {
    const derived = newGlobalStepBatch(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveGlobalStepBatch(item: GlobalStepBatch): string {
  return waitCheckpointBucket(item.effectiveValue());
}
