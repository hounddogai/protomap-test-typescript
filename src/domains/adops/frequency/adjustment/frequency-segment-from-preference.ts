import { normalizeDefaultBidRulePlanCode } from "../../bid-rule/item/default-bid-rule-plan-policy.js";
import { FallbackBidRulePreference } from "../../bid-rule/item/fallback-bid-rule-preference.js";
import { FrequencySegment, newFrequencySegment } from "./frequency-segment.js";

export function summarizeFallbackBidRulePreferencesForSegment(items: FallbackBidRulePreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveFrequencySegmentsFromPreference(items: FallbackBidRulePreference[]): FrequencySegment[] {
  const out: FrequencySegment[] = [];
  for (const item of items) {
    const derived = newFrequencySegment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function computeFrequencySegment(item: FrequencySegment): string {
  return normalizeDefaultBidRulePlanCode(item.code);
}
