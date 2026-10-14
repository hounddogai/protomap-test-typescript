import { classifyChallengeCycle } from "../../challenge/challenge-manifest/challenge-cycle-policy.js";
import { ChallengeQuota } from "../../challenge/challenge-manifest/challenge-quota.js";
import { RewardWindow, newRewardWindow } from "./reward-window.js";

export function summarizeChallengeQuotasForWindow(items: ChallengeQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveRewardWindowsFromQuota(items: ChallengeQuota[]): RewardWindow[] {
  const out: RewardWindow[] = [];
  for (const item of items) {
    const derived = newRewardWindow(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function settleRewardWindow(item: RewardWindow): string {
  return classifyChallengeCycle(item.weightedExposure());
}
