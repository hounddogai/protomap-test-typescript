import { ModelPlan } from "../../model/plan/model-plan.js";
import { modelRequestBucket } from "../../model/plan/model-request-policy.js";
import { WindowBatch, newWindowBatch } from "./window-batch.js";

export function summarizeModelPlansForBatch(items: ModelPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveWindowBatchesFromPlan(items: ModelPlan[]): WindowBatch[] {
  const out: WindowBatch[] = [];
  for (const item of items) {
    const derived = newWindowBatch(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyWindowBatch(item: WindowBatch): string {
  return modelRequestBucket(item.weightedValue());
}
