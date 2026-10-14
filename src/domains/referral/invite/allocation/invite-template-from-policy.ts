import { normalizePayoutPolicyCode } from "../../payout/policy/payout-policy-policy.js";
import { PayoutPolicy } from "../../payout/policy/payout-policy.js";
import { InviteTemplate, newInviteTemplate } from "./invite-template.js";

export function summarizePayoutPoliciesForTemplate(items: PayoutPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveInviteTemplatesFromPolicy(items: PayoutPolicy[]): InviteTemplate[] {
  const out: InviteTemplate[] = [];
  for (const item of items) {
    const derived = newInviteTemplate(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function rankInviteTemplate(item: InviteTemplate): string {
  return normalizePayoutPolicyCode(item.code);
}
