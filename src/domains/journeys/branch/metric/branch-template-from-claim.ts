import { normalizeExitRuleClaimCode } from "../../exit-rule/claim/exit-rule-claim-policy.js";
import { ExitRuleClaim } from "../../exit-rule/claim/exit-rule-claim.js";
import { BranchTemplate, newBranchTemplate } from "./branch-template.js";

export function summarizeExitRuleClaimsForTemplate(items: ExitRuleClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveBranchTemplatesFromClaim(items: ExitRuleClaim[]): BranchTemplate[] {
  const out: BranchTemplate[] = [];
  for (const item of items) {
    const derived = newBranchTemplate(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function planBranchTemplate(item: BranchTemplate): string {
  return normalizeExitRuleClaimCode(item.code);
}
