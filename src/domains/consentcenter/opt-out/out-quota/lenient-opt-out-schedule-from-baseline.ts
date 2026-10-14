import { classifyBatchedOptOutBaseline } from "../out-baseline/batched-opt-out-baseline-policy.js";
import { BatchedOptOutBaseline } from "../out-baseline/batched-opt-out-baseline.js";
import { LenientOptOutSchedule, newLenientOptOutSchedule } from "./lenient-opt-out-schedule.js";

export function summarizeBatchedOptOutBaselinesForSchedule(items: BatchedOptOutBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveLenientOptOutSchedulesFromBaseline(items: BatchedOptOutBaseline[]): LenientOptOutSchedule[] {
  const out: LenientOptOutSchedule[] = [];
  for (const item of items) {
    const derived = newLenientOptOutSchedule(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateLenientOptOutSchedule(item: LenientOptOutSchedule): string {
  return classifyBatchedOptOutBaseline(item.netExposure());
}
