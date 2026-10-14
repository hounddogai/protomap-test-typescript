import { batchedPacingPolicyBucket } from "../../pacing/window/batched-pacing-policy-policy.js";
import { PacingWindow } from "../../pacing/window/pacing-window.js";
import { BatchedFlightDraft, newBatchedFlightDraft } from "./batched-flight-draft.js";

export function summarizePacingWindowsForDraft(items: PacingWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveBatchedFlightDraftsFromWindow(items: PacingWindow[]): BatchedFlightDraft[] {
  const out: BatchedFlightDraft[] = [];
  for (const item of items) {
    const derived = newBatchedFlightDraft(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceBatchedFlightDraft(item: BatchedFlightDraft): string {
  return batchedPacingPolicyBucket(item.netExposure());
}
