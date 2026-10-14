import { classifyExitRuleForecast } from "../../exit-rule/entry/exit-rule-forecast-policy.js";
import { TieredExitRuleEntry } from "../../exit-rule/entry/tiered-exit-rule-entry.js";
import { BranchWindow, newBranchWindow } from "./branch-window.js";

export function summarizeTieredExitRuleEntriesForWindow(items: TieredExitRuleEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveBranchWindowsFromEntry(items: TieredExitRuleEntry[]): BranchWindow[] {
  const out: BranchWindow[] = [];
  for (const item of items) {
    const derived = newBranchWindow(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveBranchWindow(item: BranchWindow): string {
  return classifyExitRuleForecast(item.projectedVolume());
}
