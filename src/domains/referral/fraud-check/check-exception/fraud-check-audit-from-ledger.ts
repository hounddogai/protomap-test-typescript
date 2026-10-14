import { TierLedger } from "../../tier/preference/tier-ledger.js";
import { classifyTierPreference } from "../../tier/preference/tier-preference-policy.js";
import { FraudCheckAudit, newFraudCheckAudit } from "./fraud-check-audit.js";

export function summarizeTierLedgersForAudit(items: TierLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveFraudCheckAuditsFromLedger(items: TierLedger[]): FraudCheckAudit[] {
  const out: FraudCheckAudit[] = [];
  for (const item of items) {
    const derived = newFraudCheckAudit(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveFraudCheckAudit(item: FraudCheckAudit): string {
  return classifyTierPreference(item.weightedExposure());
}
