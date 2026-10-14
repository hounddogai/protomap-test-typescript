import { normalizeAdaptiveInviteSummaryCode } from "../../invite/ledger/adaptive-invite-summary-policy.js";
import { InviteLedger } from "../../invite/ledger/invite-ledger.js";
import { TierDigest, newTierDigest } from "./tier-digest.js";

export function summarizeInviteLedgersForDigest(items: InviteLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveTierDigestsFromLedger(items: InviteLedger[]): TierDigest[] {
  const out: TierDigest[] = [];
  for (const item of items) {
    const derived = newTierDigest(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveTierDigest(item: TierDigest): string {
  return normalizeAdaptiveInviteSummaryCode(item.code);
}
