import { classifyCappedStepEntry } from "../../step/rule/capped-step-entry-policy.js";
import { PrimaryStepEntry } from "../../step/rule/primary-step-entry.js";
import { WaitDraft, newWaitDraft } from "./wait-draft.js";

export function summarizePrimaryStepEntriesForDraft(items: PrimaryStepEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveWaitDraftsFromEntry(items: PrimaryStepEntry[]): WaitDraft[] {
  const out: WaitDraft[] = [];
  for (const item of items) {
    const derived = newWaitDraft(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function matchWaitDraft(item: WaitDraft): string {
  return classifyCappedStepEntry(item.weightedLoad());
}
