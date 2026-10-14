import { classifyRewardBaseline } from "../../reward/slot/reward-baseline-policy.js";
import { StrictRewardNotice } from "../../reward/slot/strict-reward-notice.js";
import { LevelSegment, newLevelSegment } from "./level-segment.js";

export function summarizeStrictRewardNoticesForSegment(items: StrictRewardNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLevelSegmentsFromNotice(items: StrictRewardNotice[]): LevelSegment[] {
  const out: LevelSegment[] = [];
  for (const item of items) {
    const derived = newLevelSegment(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function planLevelSegment(item: LevelSegment): string {
  return classifyRewardBaseline(item.adjustedVolume());
}
