import { normalizeExitRuleSegmentCode } from "../threshold/exit-rule-segment-policy.js";
import { RegionalExitRuleNotice } from "../threshold/regional-exit-rule-notice.js";
import { ExitRuleTier, newExitRuleTier } from "./exit-rule-tier.js";

export function summarizeRegionalExitRuleNoticesForTier(items: RegionalExitRuleNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveExitRuleTiersFromNotice(items: RegionalExitRuleNotice[]): ExitRuleTier[] {
  const out: ExitRuleTier[] = [];
  for (const item of items) {
    const derived = newExitRuleTier(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveExitRuleTier(item: ExitRuleTier): string {
  return normalizeExitRuleSegmentCode(item.code);
}
