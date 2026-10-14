import { DefaultExitRuleClaim } from "../cycle/default-exit-rule-claim.js";
import { normalizeLegacyExitRuleLedgerCode } from "../cycle/legacy-exit-rule-ledger-policy.js";
import { RollingExitRuleLedger, newRollingExitRuleLedger } from "./rolling-exit-rule-ledger.js";

export function summarizeDefaultExitRuleClaimsForLedger(items: DefaultExitRuleClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveRollingExitRuleLedgersFromClaim(items: DefaultExitRuleClaim[]): RollingExitRuleLedger[] {
  const out: RollingExitRuleLedger[] = [];
  for (const item of items) {
    const derived = newRollingExitRuleLedger(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileRollingExitRuleLedger(item: RollingExitRuleLedger): string {
  return normalizeLegacyExitRuleLedgerCode(item.code);
}
