import { BranchTemplate } from "../metric/branch-template.js";
import { classifyLenientBranchTarget } from "../metric/lenient-branch-target-policy.js";
import { BranchThreshold, newBranchThreshold } from "./branch-threshold.js";

export function summarizeBranchTemplatesForThreshold(items: BranchTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveBranchThresholdsFromTemplate(items: BranchTemplate[]): BranchThreshold[] {
  const out: BranchThreshold[] = [];
  for (const item of items) {
    const derived = newBranchThreshold(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function projectBranchThreshold(item: BranchThreshold): string {
  return classifyLenientBranchTarget(item.measuredValue());
}
