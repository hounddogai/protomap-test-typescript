import { classifyCsatEstimate } from "../../csat/slot/csat-estimate-policy.js";
import { CsatSlot } from "../../csat/slot/csat-slot.js";
import { WeightedEscalationDraft, newWeightedEscalationDraft } from "./weighted-escalation-draft.js";

export function summarizeCsatSlotsForDraft(items: CsatSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveWeightedEscalationDraftsFromSlot(items: CsatSlot[]): WeightedEscalationDraft[] {
  const out: WeightedEscalationDraft[] = [];
  for (const item of items) {
    const derived = newWeightedEscalationDraft(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function projectWeightedEscalationDraft(item: WeightedEscalationDraft): string {
  return classifyCsatEstimate(item.projectedVolume());
}
