import { normalizeRewardNoticeCode } from "../../reward/request/reward-notice-policy.js";
import { RewardNotice } from "../../reward/request/reward-notice.js";
import { LevelTarget, newLevelTarget } from "./level-target.js";

export function summarizeRewardNoticesForTarget(items: RewardNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveLevelTargetsFromNotice(items: RewardNotice[]): LevelTarget[] {
  const out: LevelTarget[] = [];
  for (const item of items) {
    const derived = newLevelTarget(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateLevelTarget(item: LevelTarget): string {
  return normalizeRewardNoticeCode(item.code);
}
