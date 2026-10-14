import { CappedStepRequest } from "../../step/allocation/capped-step-request.js";
import { classifyManualStepDraft } from "../../step/allocation/manual-step-draft-policy.js";
import { BatchedEnrollmentDraft, newBatchedEnrollmentDraft } from "./batched-enrollment-draft.js";

export function summarizeCappedStepRequestsForDraft(items: CappedStepRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveBatchedEnrollmentDraftsFromRequest(items: CappedStepRequest[]): BatchedEnrollmentDraft[] {
  const out: BatchedEnrollmentDraft[] = [];
  for (const item of items) {
    const derived = newBatchedEnrollmentDraft(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleBatchedEnrollmentDraft(item: BatchedEnrollmentDraft): string {
  return classifyManualStepDraft(item.measuredValue());
}
