import {
  normalizeFallbackCreativePreferenceCode,
} from "../../creative/preference/fallback-creative-preference-policy.js";
import { FallbackCreativePreference } from "../../creative/preference/fallback-creative-preference.js";
import { BidRuleDigest, newBidRuleDigest } from "./bid-rule-digest.js";

export function summarizeFallbackCreativePreferencesForDigest(items: FallbackCreativePreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveBidRuleDigestsFromPreference(items: FallbackCreativePreference[]): BidRuleDigest[] {
  const out: BidRuleDigest[] = [];
  for (const item of items) {
    const derived = newBidRuleDigest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveBidRuleDigest(item: BidRuleDigest): string {
  return normalizeFallbackCreativePreferenceCode(item.code);
}
