import { GlobalFrequencyBudget } from "../../frequency/estimate/global-frequency-budget.js";
import { globalFrequencyClaimBucket } from "../../frequency/estimate/global-frequency-claim-policy.js";
import { FlightDraft, newFlightDraft } from "./flight-draft.js";

export function summarizeGlobalFrequencyBudgetsForDraft(items: GlobalFrequencyBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveFlightDraftsFromBudget(items: GlobalFrequencyBudget[]): FlightDraft[] {
  const out: FlightDraft[] = [];
  for (const item of items) {
    const derived = newFlightDraft(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function rankFlightDraft(item: FlightDraft): string {
  return globalFrequencyClaimBucket(item.adjustedTotal());
}
