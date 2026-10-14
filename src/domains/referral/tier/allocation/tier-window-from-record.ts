import { normalizeInviteRecordCode } from "../../invite/record-item/invite-record-policy.js";
import { InviteRecord } from "../../invite/record-item/invite-record.js";
import { TierWindow, newTierWindow } from "./tier-window.js";

export function summarizeInviteRecordsForWindow(items: InviteRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveTierWindowsFromRecord(items: InviteRecord[]): TierWindow[] {
  const out: TierWindow[] = [];
  for (const item of items) {
    const derived = newTierWindow(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function rankTierWindow(item: TierWindow): string {
  return normalizeInviteRecordCode(item.code);
}
