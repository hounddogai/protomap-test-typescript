import { classifyBatchedPlacementDraft } from "../../placement/notice/batched-placement-draft-policy.js";
import { RollingPlacementAudit } from "../../placement/notice/rolling-placement-audit.js";
import { AdaptiveCreativeBudget, newAdaptiveCreativeBudget } from "./adaptive-creative-budget.js";

export function summarizeRollingPlacementAuditsForBudget(items: RollingPlacementAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveAdaptiveCreativeBudgetsFromAudit(items: RollingPlacementAudit[]): AdaptiveCreativeBudget[] {
  const out: AdaptiveCreativeBudget[] = [];
  for (const item of items) {
    const derived = newAdaptiveCreativeBudget(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreAdaptiveCreativeBudget(item: AdaptiveCreativeBudget): string {
  return classifyBatchedPlacementDraft(item.projectedLoad());
}
