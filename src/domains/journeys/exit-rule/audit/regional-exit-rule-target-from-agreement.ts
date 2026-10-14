import { normalizeSeasonalExitRuleAgreementCode } from "../claim/seasonal-exit-rule-agreement-policy.js";
import { SeasonalExitRuleAgreement } from "../claim/seasonal-exit-rule-agreement.js";
import { RegionalExitRuleTarget, newRegionalExitRuleTarget } from "./regional-exit-rule-target.js";

export function summarizeSeasonalExitRuleAgreementsForTarget(items: SeasonalExitRuleAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveRegionalExitRuleTargetsFromAgreement(items: SeasonalExitRuleAgreement[]): RegionalExitRuleTarget[] {
  const out: RegionalExitRuleTarget[] = [];
  for (const item of items) {
    const derived = newRegionalExitRuleTarget(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function matchRegionalExitRuleTarget(item: RegionalExitRuleTarget): string {
  return normalizeSeasonalExitRuleAgreementCode(item.code);
}
