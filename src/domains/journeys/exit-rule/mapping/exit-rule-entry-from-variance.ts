import { BranchVariance } from "../../branch/bundle/branch-variance.js";
import { classifyGlobalBranchDigest } from "../../branch/bundle/global-branch-digest-policy.js";
import { ExitRuleEntry, newExitRuleEntry } from "./exit-rule-entry.js";

export function summarizeBranchVariancesForEntry(items: BranchVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveExitRuleEntriesFromVariance(items: BranchVariance[]): ExitRuleEntry[] {
  const out: ExitRuleEntry[] = [];
  for (const item of items) {
    const derived = newExitRuleEntry(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitExitRuleEntry(item: ExitRuleEntry): string {
  return classifyGlobalBranchDigest(item.projectedTotal());
}
