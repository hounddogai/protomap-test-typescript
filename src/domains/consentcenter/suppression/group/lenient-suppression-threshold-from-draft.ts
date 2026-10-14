import { suppressionCycleWeight } from "../reservation/suppression-cycle-policy.js";
import { SuppressionDraft } from "../reservation/suppression-draft.js";
import { LenientSuppressionThreshold, newLenientSuppressionThreshold } from "./lenient-suppression-threshold.js";

export function summarizeSuppressionDraftsForThreshold(items: SuppressionDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLenientSuppressionThresholdsFromDraft(items: SuppressionDraft[]): LenientSuppressionThreshold[] {
  const out: LenientSuppressionThreshold[] = [];
  for (const item of items) {
    const derived = newLenientSuppressionThreshold(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function planLenientSuppressionThreshold(item: LenientSuppressionThreshold): number {
  return suppressionCycleWeight(2, true);
}
