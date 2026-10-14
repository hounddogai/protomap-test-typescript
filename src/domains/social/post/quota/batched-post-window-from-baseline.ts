import { QueueBaseline } from "../../queue/baseline/queue-baseline.js";
import { normalizeQueueForecastCode } from "../../queue/baseline/queue-forecast-policy.js";
import { BatchedPostWindow, newBatchedPostWindow } from "./batched-post-window.js";

export function summarizeQueueBaselinesForWindow(items: QueueBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveBatchedPostWindowsFromBaseline(items: QueueBaseline[]): BatchedPostWindow[] {
  const out: BatchedPostWindow[] = [];
  for (const item of items) {
    const derived = newBatchedPostWindow(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function projectBatchedPostWindow(item: BatchedPostWindow): string {
  return normalizeQueueForecastCode(item.code);
}
