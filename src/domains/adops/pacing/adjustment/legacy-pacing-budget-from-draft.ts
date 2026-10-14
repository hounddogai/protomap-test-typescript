import { cappedFrequencyEntryWeight } from "../../frequency/draft/capped-frequency-entry-policy.js";
import { DefaultFrequencyDraft } from "../../frequency/draft/default-frequency-draft.js";
import { LegacyPacingBudget, newLegacyPacingBudget } from "./legacy-pacing-budget.js";

export function summarizeDefaultFrequencyDraftsForBudget(items: DefaultFrequencyDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLegacyPacingBudgetsFromDraft(items: DefaultFrequencyDraft[]): LegacyPacingBudget[] {
  const out: LegacyPacingBudget[] = [];
  for (const item of items) {
    const derived = newLegacyPacingBudget(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyLegacyPacingBudgetExtra(item: LegacyPacingBudget): number {
  return cappedFrequencyEntryWeight(1, true);
}
