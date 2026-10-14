import { scheduledChallengeWindowBucket } from "../../challenge/target/scheduled-challenge-window-policy.js";
import { ScheduledChallengeWindow } from "../../challenge/target/scheduled-challenge-window.js";
import { PrimaryRewardRequest, newPrimaryRewardRequest } from "./primary-reward-request.js";

export function summarizeScheduledChallengeWindowsForRequest(items: ScheduledChallengeWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function derivePrimaryRewardRequestsFromWindow(items: ScheduledChallengeWindow[]): PrimaryRewardRequest[] {
  const out: PrimaryRewardRequest[] = [];
  for (const item of items) {
    const derived = newPrimaryRewardRequest(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function resolvePrimaryRewardRequest(item: PrimaryRewardRequest): string {
  return scheduledChallengeWindowBucket(item.adjustedLoad());
}
