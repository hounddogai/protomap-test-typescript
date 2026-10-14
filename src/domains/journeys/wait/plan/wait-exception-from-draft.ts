import { globalStepBatchBucket } from "../../step/record-item/global-step-batch-policy.js";
import { StepDraft } from "../../step/record-item/step-draft.js";
import { WaitException, newWaitException } from "./wait-exception.js";

export function summarizeStepDraftsForException(items: StepDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveWaitExceptionsFromDraft(items: StepDraft[]): WaitException[] {
  const out: WaitException[] = [];
  for (const item of items) {
    const derived = newWaitException(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateWaitException(item: WaitException): string {
  return globalStepBatchBucket(item.projectedVolume());
}
