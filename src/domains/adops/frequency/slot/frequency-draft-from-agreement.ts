import { PlacementAgreement } from "../../placement/estimate/placement-agreement.js";
import { placementExceptionWeight } from "../../placement/estimate/placement-exception-policy.js";
import { FrequencyDraft, newFrequencyDraft } from "./frequency-draft.js";

export function summarizePlacementAgreementsForDraft(items: PlacementAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveFrequencyDraftsFromAgreement(items: PlacementAgreement[]): FrequencyDraft[] {
  const out: FrequencyDraft[] = [];
  for (const item of items) {
    const derived = newFrequencyDraft(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeFrequencyDraft(item: FrequencyDraft): number {
  return placementExceptionWeight(4, true);
}
