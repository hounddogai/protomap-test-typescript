import { classifyWaitRule } from "../../wait/rule/wait-rule-policy.js";
import { WaitRule } from "../../wait/rule/wait-rule.js";
import { StepEntry, newStepEntry } from "./step-entry.js";

export function summarizeWaitRulesForEntry(items: WaitRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveStepEntriesFromRule(items: WaitRule[]): StepEntry[] {
  const out: StepEntry[] = [];
  for (const item of items) {
    const derived = newStepEntry(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateStepEntry(item: StepEntry): string {
  return classifyWaitRule(item.measuredValue());
}
