import { classifyBatchedComplaintWindow } from "../../complaint/window/batched-complaint-window-policy.js";
import { ComplaintPreference } from "../../complaint/window/complaint-preference.js";
import { ReputationException, newReputationException } from "./reputation-exception.js";

export function summarizeComplaintPreferencesForException(items: ComplaintPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveReputationExceptionsFromPreference(items: ComplaintPreference[]): ReputationException[] {
  const out: ReputationException[] = [];
  for (const item of items) {
    const derived = newReputationException(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function applyReputationException(item: ReputationException): string {
  return classifyBatchedComplaintWindow(item.weightedTotal());
}
