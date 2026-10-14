import { FraudCheckRequest } from "../../fraud-check/rule/fraud-check-request.js";
import { classifyLegacyFraudCheckDigest } from "../../fraud-check/rule/legacy-fraud-check-digest-policy.js";
import { InviteAgreement, newInviteAgreement } from "./invite-agreement.js";

export function summarizeFraudCheckRequestsForAgreement(items: FraudCheckRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveInviteAgreementsFromRequest(items: FraudCheckRequest[]): InviteAgreement[] {
  const out: InviteAgreement[] = [];
  for (const item of items) {
    const derived = newInviteAgreement(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileInviteAgreement(item: InviteAgreement): string {
  return classifyLegacyFraudCheckDigest(item.measuredValue());
}
