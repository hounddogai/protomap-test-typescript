import { scheduledWindowBatchWeight } from "../../window/exception/scheduled-window-batch-policy.js";
import { ScheduledWindowBatch } from "../../window/exception/scheduled-window-batch.js";
import { RollingPathMapping, newRollingPathMapping } from "./rolling-path-mapping.js";

export function summarizeScheduledWindowBatchesForMapping(items: ScheduledWindowBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRollingPathMappingsFromBatch(items: ScheduledWindowBatch[]): RollingPathMapping[] {
  const out: RollingPathMapping[] = [];
  for (const item of items) {
    const derived = newRollingPathMapping(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateRollingPathMapping(item: RollingPathMapping): number {
  return scheduledWindowBatchWeight(9, true);
}
