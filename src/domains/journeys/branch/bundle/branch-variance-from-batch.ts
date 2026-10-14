import { StepBatch } from "../../step/quota/step-batch.js";
import { classifyStepSummary } from "../../step/quota/step-summary-policy.js";
import { BranchVariance, newBranchVariance } from "./branch-variance.js";

export function summarizeStepBatchesForVariance(items: StepBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveBranchVariancesFromBatch(items: StepBatch[]): BranchVariance[] {
  const out: BranchVariance[] = [];
  for (const item of items) {
    const derived = newBranchVariance(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateBranchVariance(item: BranchVariance): string {
  return classifyStepSummary(item.projectedValue());
}
