import { classifyExitRuleManifest } from "../proposal/exit-rule-manifest-policy.js";
import { GlobalExitRuleAllocation } from "../proposal/global-exit-rule-allocation.js";
import { ExitRuleTarget, newExitRuleTarget } from "./exit-rule-target.js";

export function summarizeGlobalExitRuleAllocationsForTarget(items: GlobalExitRuleAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveExitRuleTargetsFromAllocation(items: GlobalExitRuleAllocation[]): ExitRuleTarget[] {
  const out: ExitRuleTarget[] = [];
  for (const item of items) {
    const derived = newExitRuleTarget(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreExitRuleTarget(item: ExitRuleTarget): string {
  return classifyExitRuleManifest(item.weightedVolume());
}
