import { normalizeAdaptiveInviteSummaryCode } from "../ledger/adaptive-invite-summary-policy.js";
import { InviteLedger } from "../ledger/invite-ledger.js";
import { InviteOverride, newInviteOverride } from "./invite-override.js";

export function summarizeInviteLedgersForOverride(items: InviteLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveInviteOverridesFromLedger(items: InviteLedger[]): InviteOverride[] {
  const out: InviteOverride[] = [];
  for (const item of items) {
    const derived = newInviteOverride(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceInviteOverride(item: InviteOverride): string {
  return normalizeAdaptiveInviteSummaryCode(item.code);
}
