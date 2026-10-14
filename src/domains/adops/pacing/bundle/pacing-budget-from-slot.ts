import {
  normalizeBatchedFrequencyCycleCode,
} from "../../frequency/frequency-cycle/batched-frequency-cycle-policy.js";
import { CappedFrequencySlot } from "../../frequency/frequency-cycle/capped-frequency-slot.js";
import { PacingBudget, newPacingBudget } from "./pacing-budget.js";

export function summarizeCappedFrequencySlotsForBudget(items: CappedFrequencySlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function derivePacingBudgetsFromSlot(items: CappedFrequencySlot[]): PacingBudget[] {
  const out: PacingBudget[] = [];
  for (const item of items) {
    const derived = newPacingBudget(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizePacingBudget(item: PacingBudget): string {
  return normalizeBatchedFrequencyCycleCode(item.code);
}
