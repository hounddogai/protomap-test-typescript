import { classifyModelDraft } from "../budget/model-draft-policy.js";
import { ModelDraft } from "../budget/model-draft.js";
import { ManualModelDraft, newManualModelDraft } from "./manual-model-draft.js";

export function summarizeModelDraftsForDraft(items: ModelDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveManualModelDraftsFromDraft(items: ModelDraft[]): ManualModelDraft[] {
  const out: ManualModelDraft[] = [];
  for (const item of items) {
    const derived = newManualModelDraft(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function rankManualModelDraft(item: ManualModelDraft): string {
  return classifyModelDraft(item.effectiveVolume());
}
