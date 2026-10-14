import { LenientPayoutScore } from "../../payout/rule/lenient-payout-score.js";
import { normalizeManualPayoutEstimateCode } from "../../payout/rule/manual-payout-estimate-policy.js";
import { FallbackRewardRuleAgreement, newFallbackRewardRuleAgreement } from "./fallback-reward-rule-agreement.js";

export function summarizeLenientPayoutScoresForAgreement(items: LenientPayoutScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveFallbackRewardRuleAgreementsFromScore(items: LenientPayoutScore[]): FallbackRewardRuleAgreement[] {
  const out: FallbackRewardRuleAgreement[] = [];
  for (const item of items) {
    const derived = newFallbackRewardRuleAgreement(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateFallbackRewardRuleAgreement(item: FallbackRewardRuleAgreement): string {
  return normalizeManualPayoutEstimateCode(item.code);
}
