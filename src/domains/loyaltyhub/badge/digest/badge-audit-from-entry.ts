import { manualRewardEntryWeight } from "../../reward/entry/manual-reward-entry-policy.js";
import { PendingRewardEntry } from "../../reward/entry/pending-reward-entry.js";
import { BadgeAudit, newBadgeAudit } from "./badge-audit.js";

export function summarizePendingRewardEntriesForAudit(items: PendingRewardEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveBadgeAuditsFromEntry(items: PendingRewardEntry[]): BadgeAudit[] {
  const out: BadgeAudit[] = [];
  for (const item of items) {
    const derived = newBadgeAudit(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveBadgeAudit(item: BadgeAudit): number {
  return manualRewardEntryWeight(1, true);
}
