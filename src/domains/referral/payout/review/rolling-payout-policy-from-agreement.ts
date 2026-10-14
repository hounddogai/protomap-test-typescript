import { FallbackPayoutAgreement } from "../checkpoint/fallback-payout-agreement.js";
import { normalizePayoutDraftCode } from "../checkpoint/payout-draft-policy.js";
import { RollingPayoutPolicy, newRollingPayoutPolicy } from "./rolling-payout-policy.js";

export function summarizeFallbackPayoutAgreementsForPolicy(items: FallbackPayoutAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveRollingPayoutPoliciesFromAgreement(items: FallbackPayoutAgreement[]): RollingPayoutPolicy[] {
  const out: RollingPayoutPolicy[] = [];
  for (const item of items) {
    const derived = newRollingPayoutPolicy(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveRollingPayoutPolicy(item: RollingPayoutPolicy): string {
  return normalizePayoutDraftCode(item.code);
}
