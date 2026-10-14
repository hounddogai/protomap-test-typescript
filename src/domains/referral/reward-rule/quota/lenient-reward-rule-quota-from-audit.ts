import {
  normalizeCappedTierAllocationCode,
} from "../../tier/fallback-tier-allocation/capped-tier-allocation-policy.js";
import { PendingTierAudit } from "../../tier/fallback-tier-allocation/pending-tier-audit.js";
import { LenientRewardRuleQuota, newLenientRewardRuleQuota } from "./lenient-reward-rule-quota.js";

export function summarizePendingTierAuditsForQuota(items: PendingTierAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveLenientRewardRuleQuotasFromAudit(items: PendingTierAudit[]): LenientRewardRuleQuota[] {
  const out: LenientRewardRuleQuota[] = [];
  for (const item of items) {
    const derived = newLenientRewardRuleQuota(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function computeLenientRewardRuleQuota(item: LenientRewardRuleQuota): string {
  return normalizeCappedTierAllocationCode(item.code);
}
