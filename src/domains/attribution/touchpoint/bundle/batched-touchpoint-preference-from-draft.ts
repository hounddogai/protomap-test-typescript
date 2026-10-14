import { legacyModelDraftWeight } from "../../model/model-draft/legacy-model-draft-policy.js";
import { LegacyModelDraft } from "../../model/model-draft/legacy-model-draft.js";
import { BatchedTouchpointPreference, newBatchedTouchpointPreference } from "./batched-touchpoint-preference.js";

export function summarizeLegacyModelDraftsForPreference(items: LegacyModelDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveBatchedTouchpointPreferencesFromDraft(items: LegacyModelDraft[]): BatchedTouchpointPreference[] {
  const out: BatchedTouchpointPreference[] = [];
  for (const item of items) {
    const derived = newBatchedTouchpointPreference(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeBatchedTouchpointPreference(item: BatchedTouchpointPreference): number {
  return legacyModelDraftWeight(9, true);
}
