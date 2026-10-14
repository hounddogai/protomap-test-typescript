import { normalizeBidRuleVarianceCode } from "../../bid-rule/rule-manifest/bid-rule-variance-policy.js";
import { LenientBidRuleManifest } from "../../bid-rule/rule-manifest/lenient-bid-rule-manifest.js";
import { ManualFrequencyDraft, newManualFrequencyDraft } from "./manual-frequency-draft.js";

export function summarizeLenientBidRuleManifestsForDraft(items: LenientBidRuleManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveManualFrequencyDraftsFromManifest(items: LenientBidRuleManifest[]): ManualFrequencyDraft[] {
  const out: ManualFrequencyDraft[] = [];
  for (const item of items) {
    const derived = newManualFrequencyDraft(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileManualFrequencyDraft(item: ManualFrequencyDraft): string {
  return normalizeBidRuleVarianceCode(item.code);
}
