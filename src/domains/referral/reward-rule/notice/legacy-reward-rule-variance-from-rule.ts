import {
  normalizeFallbackFraudCheckClaimCode,
} from "../../fraud-check/schedule/fallback-fraud-check-claim-policy.js";
import { ScheduledFraudCheckRule } from "../../fraud-check/schedule/scheduled-fraud-check-rule.js";
import { LegacyRewardRuleVariance, newLegacyRewardRuleVariance } from "./legacy-reward-rule-variance.js";

export function summarizeScheduledFraudCheckRulesForVariance(items: ScheduledFraudCheckRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveLegacyRewardRuleVariancesFromRule(items: ScheduledFraudCheckRule[]): LegacyRewardRuleVariance[] {
  const out: LegacyRewardRuleVariance[] = [];
  for (const item of items) {
    const derived = newLegacyRewardRuleVariance(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function planLegacyRewardRuleVariance(item: LegacyRewardRuleVariance): string {
  return normalizeFallbackFraudCheckClaimCode(item.code);
}
