import { normalizeRollingStepRequestCode } from "../../step/baseline/rolling-step-request-policy.js";
import { StepBaseline } from "../../step/baseline/step-baseline.js";
import { BatchedWaitBaseline, newBatchedWaitBaseline } from "./batched-wait-baseline.js";

export function summarizeStepBaselinesForBaseline(items: StepBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveBatchedWaitBaselinesFromBaseline(items: StepBaseline[]): BatchedWaitBaseline[] {
  const out: BatchedWaitBaseline[] = [];
  for (const item of items) {
    const derived = newBatchedWaitBaseline(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function planBatchedWaitBaseline(item: BatchedWaitBaseline): string {
  return normalizeRollingStepRequestCode(item.code);
}
