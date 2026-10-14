import { FraudCheckAgreement } from "../../fraud-check/digest/fraud-check-agreement.js";
import { fraudCheckForecastBucket } from "../../fraud-check/digest/fraud-check-forecast-policy.js";
import { GlobalRewardRuleBundle, newGlobalRewardRuleBundle } from "./global-reward-rule-bundle.js";

export function summarizeFraudCheckAgreementsForBundle(items: FraudCheckAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveGlobalRewardRuleBundlesFromAgreement(items: FraudCheckAgreement[]): GlobalRewardRuleBundle[] {
  const out: GlobalRewardRuleBundle[] = [];
  for (const item of items) {
    const derived = newGlobalRewardRuleBundle(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreGlobalRewardRuleBundle(item: GlobalRewardRuleBundle): string {
  return fraudCheckForecastBucket(item.projectedLoad());
}
