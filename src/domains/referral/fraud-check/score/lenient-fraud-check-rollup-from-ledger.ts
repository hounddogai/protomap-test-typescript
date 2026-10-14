import { normalizeAdaptiveInviteSummaryCode } from "../../invite/ledger/adaptive-invite-summary-policy.js";
import { InviteLedger } from "../../invite/ledger/invite-ledger.js";
import { LenientFraudCheckRollup, newLenientFraudCheckRollup } from "./lenient-fraud-check-rollup.js";

export function summarizeInviteLedgersForRollup(items: InviteLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveLenientFraudCheckRollupsFromLedger(items: InviteLedger[]): LenientFraudCheckRollup[] {
  const out: LenientFraudCheckRollup[] = [];
  for (const item of items) {
    const derived = newLenientFraudCheckRollup(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignLenientFraudCheckRollup(item: LenientFraudCheckRollup): string {
  return normalizeAdaptiveInviteSummaryCode(item.code);
}
