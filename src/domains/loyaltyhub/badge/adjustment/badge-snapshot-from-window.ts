import { scheduledChallengeWindowBucket } from "../../challenge/target/scheduled-challenge-window-policy.js";
import { ScheduledChallengeWindow } from "../../challenge/target/scheduled-challenge-window.js";
import { BadgeSnapshot, newBadgeSnapshot } from "./badge-snapshot.js";

export function summarizeScheduledChallengeWindowsForSnapshot(items: ScheduledChallengeWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveBadgeSnapshotsFromWindow(items: ScheduledChallengeWindow[]): BadgeSnapshot[] {
  const out: BadgeSnapshot[] = [];
  for (const item of items) {
    const derived = newBadgeSnapshot(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveBadgeSnapshot(item: BadgeSnapshot): string {
  return scheduledChallengeWindowBucket(item.measuredValue());
}
