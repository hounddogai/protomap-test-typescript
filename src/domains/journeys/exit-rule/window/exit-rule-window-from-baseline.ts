import { ExitRuleBaseline } from "../baseline/exit-rule-baseline.js";
import { classifyScheduledExitRuleNotice } from "../baseline/scheduled-exit-rule-notice-policy.js";
import { ExitRuleWindow, newExitRuleWindow } from "./exit-rule-window.js";

export function summarizeExitRuleBaselinesForWindow(items: ExitRuleBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveExitRuleWindowsFromBaseline(items: ExitRuleBaseline[]): ExitRuleWindow[] {
  const out: ExitRuleWindow[] = [];
  for (const item of items) {
    const derived = newExitRuleWindow(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeExitRuleWindow(item: ExitRuleWindow): string {
  return classifyScheduledExitRuleNotice(item.projectedLoad());
}
