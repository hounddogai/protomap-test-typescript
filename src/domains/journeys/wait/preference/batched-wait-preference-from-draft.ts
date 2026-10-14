import { classifyManualStepDraft } from "../../step/allocation/manual-step-draft-policy.js";
import { ManualStepDraft } from "../../step/allocation/manual-step-draft.js";
import { BatchedWaitPreference, newBatchedWaitPreference } from "./batched-wait-preference.js";

export function summarizeManualStepDraftsForPreference(items: ManualStepDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveBatchedWaitPreferencesFromDraft(items: ManualStepDraft[]): BatchedWaitPreference[] {
  const out: BatchedWaitPreference[] = [];
  for (const item of items) {
    const derived = newBatchedWaitPreference(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankBatchedWaitPreference(item: BatchedWaitPreference): string {
  return classifyManualStepDraft(item.projectedExposure());
}
