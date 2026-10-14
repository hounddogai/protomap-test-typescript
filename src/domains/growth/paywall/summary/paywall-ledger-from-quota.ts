import { retentionAuditWeight } from "../../retention/audit/retention-audit-policy.js";
import { RetentionQuota } from "../../retention/audit/retention-quota.js";
import { PaywallLedger, newPaywallLedger } from "./paywall-ledger.js";

export function summarizeRetentionQuotasForLedger(items: RetentionQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function derivePaywallLedgersFromQuota(items: RetentionQuota[]): PaywallLedger[] {
  const out: PaywallLedger[] = [];
  for (const item of items) {
    const derived = newPaywallLedger(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settlePaywallLedger(item: PaywallLedger): number {
  return retentionAuditWeight(1, true);
}
