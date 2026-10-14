import { GlobalPacingAudit } from "../../pacing/ledger/global-pacing-audit.js";
import { normalizePacingTierCode } from "../../pacing/ledger/pacing-tier-policy.js";
import { CappedBidRuleQuota, newCappedBidRuleQuota } from "./capped-bid-rule-quota.js";

export function summarizeGlobalPacingAuditsForQuota(items: GlobalPacingAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCappedBidRuleQuotasFromAudit(items: GlobalPacingAudit[]): CappedBidRuleQuota[] {
  const out: CappedBidRuleQuota[] = [];
  for (const item of items) {
    const derived = newCappedBidRuleQuota(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function computeCappedBidRuleQuota(item: CappedBidRuleQuota): string {
  return normalizePacingTierCode(item.code);
}
