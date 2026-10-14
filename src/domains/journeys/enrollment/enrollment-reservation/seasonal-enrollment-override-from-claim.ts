import { ExitRuleClaim } from "../../exit-rule/claim/exit-rule-claim.js";
import { normalizeSeasonalExitRuleAgreementCode } from "../../exit-rule/claim/seasonal-exit-rule-agreement-policy.js";
import { SeasonalEnrollmentOverride, newSeasonalEnrollmentOverride } from "./seasonal-enrollment-override.js";

export function summarizeExitRuleClaimsForOverride(items: ExitRuleClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveSeasonalEnrollmentOverridesFromClaim(items: ExitRuleClaim[]): SeasonalEnrollmentOverride[] {
  const out: SeasonalEnrollmentOverride[] = [];
  for (const item of items) {
    const derived = newSeasonalEnrollmentOverride(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveSeasonalEnrollmentOverride(item: SeasonalEnrollmentOverride): string {
  return normalizeSeasonalExitRuleAgreementCode(item.code);
}
