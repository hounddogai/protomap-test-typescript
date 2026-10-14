import { normalizeCappedProofRuleCode } from "../../proof/rule/capped-proof-rule-policy.js";
import { CappedProofRule } from "../../proof/rule/capped-proof-rule.js";
import { OptOutVariance, newOptOutVariance } from "./opt-out-variance.js";

export function summarizeCappedProofRulesForVariance(items: CappedProofRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveOptOutVariancesFromRule(items: CappedProofRule[]): OptOutVariance[] {
  const out: OptOutVariance[] = [];
  for (const item of items) {
    const derived = newOptOutVariance(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceOptOutVariance(item: OptOutVariance): string {
  return normalizeCappedProofRuleCode(item.code);
}
