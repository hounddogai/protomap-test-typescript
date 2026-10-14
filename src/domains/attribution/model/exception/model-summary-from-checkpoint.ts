import { normalizeWindowCheckpointCode } from "../../window/batch/window-checkpoint-policy.js";
import { WindowCheckpoint } from "../../window/batch/window-checkpoint.js";
import { ModelSummary, newModelSummary } from "./model-summary.js";

export function summarizeWindowCheckpointsForSummary(items: WindowCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveModelSummariesFromCheckpoint(items: WindowCheckpoint[]): ModelSummary[] {
  const out: ModelSummary[] = [];
  for (const item of items) {
    const derived = newModelSummary(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignModelSummary(item: ModelSummary): string {
  return normalizeWindowCheckpointCode(item.code);
}
