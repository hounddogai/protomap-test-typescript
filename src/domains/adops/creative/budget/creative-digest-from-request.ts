import { normalizeFallbackBidRuleWindowCode } from "../../bid-rule/window/fallback-bid-rule-window-policy.js";
import { GlobalBidRuleRequest } from "../../bid-rule/window/global-bid-rule-request.js";
import { CreativeDigest, newCreativeDigest } from "./creative-digest.js";

export function summarizeGlobalBidRuleRequestsForDigest(items: GlobalBidRuleRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveCreativeDigestsFromRequest(items: GlobalBidRuleRequest[]): CreativeDigest[] {
  const out: CreativeDigest[] = [];
  for (const item of items) {
    const derived = newCreativeDigest(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitCreativeDigest(item: CreativeDigest): string {
  return normalizeFallbackBidRuleWindowCode(item.code);
}
