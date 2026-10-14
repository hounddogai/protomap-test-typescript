import { normalizeManualFrequencyDraftCode } from "../../frequency/variance/manual-frequency-draft-policy.js";
import { ManualFrequencyDraft } from "../../frequency/variance/manual-frequency-draft.js";
import { StrictBidRuleThreshold, newStrictBidRuleThreshold } from "./strict-bid-rule-threshold.js";

export function summarizeManualFrequencyDraftsForThreshold(items: ManualFrequencyDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveStrictBidRuleThresholdsFromDraft(items: ManualFrequencyDraft[]): StrictBidRuleThreshold[] {
  const out: StrictBidRuleThreshold[] = [];
  for (const item of items) {
    const derived = newStrictBidRuleThreshold(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeStrictBidRuleThreshold(item: StrictBidRuleThreshold): string {
  return normalizeManualFrequencyDraftCode(item.code);
}
