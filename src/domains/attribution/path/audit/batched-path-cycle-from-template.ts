import { normalizeConversionSnapshotCode } from "../../conversion/slot/conversion-snapshot-policy.js";
import { ConversionTemplate } from "../../conversion/slot/conversion-template.js";
import { BatchedPathCycle, newBatchedPathCycle } from "./batched-path-cycle.js";

export function summarizeConversionTemplatesForCycle(items: ConversionTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveBatchedPathCyclesFromTemplate(items: ConversionTemplate[]): BatchedPathCycle[] {
  const out: BatchedPathCycle[] = [];
  for (const item of items) {
    const derived = newBatchedPathCycle(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveBatchedPathCycle(item: BatchedPathCycle): string {
  return normalizeConversionSnapshotCode(item.code);
}
