import { fallbackPayoutAgreementBucket } from "../../payout/checkpoint/fallback-payout-agreement-policy.js";
import { GlobalPayoutDraft } from "../../payout/checkpoint/global-payout-draft.js";
import { DefaultInviteEntry, newDefaultInviteEntry } from "./default-invite-entry.js";

export function summarizeGlobalPayoutDraftsForEntry(items: GlobalPayoutDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveDefaultInviteEntriesFromDraft(items: GlobalPayoutDraft[]): DefaultInviteEntry[] {
  const out: DefaultInviteEntry[] = [];
  for (const item of items) {
    const derived = newDefaultInviteEntry(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function matchDefaultInviteEntry(item: DefaultInviteEntry): string {
  return fallbackPayoutAgreementBucket(item.netLoad());
}
