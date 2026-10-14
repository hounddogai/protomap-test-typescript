import { BatchedLevelRequest } from "../override-item/batched-level-request.js";
import { seasonalLevelOverrideBucket } from "../override-item/seasonal-level-override-policy.js";
import { ManualLevelBudget, newManualLevelBudget } from "./manual-level-budget.js";

export function summarizeBatchedLevelRequestsForBudget(items: BatchedLevelRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveManualLevelBudgetsFromRequest(items: BatchedLevelRequest[]): ManualLevelBudget[] {
  const out: ManualLevelBudget[] = [];
  for (const item of items) {
    const derived = newManualLevelBudget(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function computeManualLevelBudget(item: ManualLevelBudget): string {
  return seasonalLevelOverrideBucket(item.projectedTotal());
}
