import { classifyCappedDomainThreshold } from "../../domain/score/capped-domain-threshold-policy.js";
import { CappedDomainThreshold } from "../../domain/score/capped-domain-threshold.js";
import { BounceDraft, newBounceDraft } from "./bounce-draft.js";

export function summarizeCappedDomainThresholdsForDraft(items: CappedDomainThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveBounceDraftsFromThreshold(items: CappedDomainThreshold[]): BounceDraft[] {
  const out: BounceDraft[] = [];
  for (const item of items) {
    const derived = newBounceDraft(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceBounceDraft(item: BounceDraft): string {
  return classifyCappedDomainThreshold(item.weightedExposure());
}
