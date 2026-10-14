import { classifyWeightedEscalationDraft } from "../draft/weighted-escalation-draft-policy.js";
import { WeightedEscalationDraft } from "../draft/weighted-escalation-draft.js";
import { EscalationVariance, newEscalationVariance } from "./escalation-variance.js";

export function summarizeWeightedEscalationDraftsForVariance(items: WeightedEscalationDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveEscalationVariancesFromDraft(items: WeightedEscalationDraft[]): EscalationVariance[] {
  const out: EscalationVariance[] = [];
  for (const item of items) {
    const derived = newEscalationVariance(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function matchEscalationVariance(item: EscalationVariance): string {
  return classifyWeightedEscalationDraft(item.adjustedTotal());
}
