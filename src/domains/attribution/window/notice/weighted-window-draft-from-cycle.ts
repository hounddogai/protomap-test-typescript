import { normalizeBatchedPathCycleCode } from "../../path/audit/batched-path-cycle-policy.js";
import { BatchedPathCycle } from "../../path/audit/batched-path-cycle.js";
import { WeightedWindowDraft, newWeightedWindowDraft } from "./weighted-window-draft.js";

export function summarizeBatchedPathCyclesForDraft(items: BatchedPathCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveWeightedWindowDraftsFromCycle(items: BatchedPathCycle[]): WeightedWindowDraft[] {
  const out: WeightedWindowDraft[] = [];
  for (const item of items) {
    const derived = newWeightedWindowDraft(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyWeightedWindowDraft(item: WeightedWindowDraft): string {
  return normalizeBatchedPathCycleCode(item.code);
}
