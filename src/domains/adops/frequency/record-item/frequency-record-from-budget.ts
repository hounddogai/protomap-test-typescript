import { FrequencyBudget } from "../budget/frequency-budget.js";
import { classifyFrequencyWindow } from "../budget/frequency-window-policy.js";
import { FrequencyRecord, newFrequencyRecord } from "./frequency-record.js";

export function summarizeFrequencyBudgetsForRecord(items: FrequencyBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveFrequencyRecordsFromBudget(items: FrequencyBudget[]): FrequencyRecord[] {
  const out: FrequencyRecord[] = [];
  for (const item of items) {
    const derived = newFrequencyRecord(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveFrequencyRecord(item: FrequencyRecord): string {
  return classifyFrequencyWindow(item.adjustedValue());
}
