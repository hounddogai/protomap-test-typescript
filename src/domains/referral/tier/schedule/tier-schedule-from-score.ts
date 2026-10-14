import { scheduledTierScoreWeight } from "../pending-tier-manifest/scheduled-tier-score-policy.js";
import { ScheduledTierScore } from "../pending-tier-manifest/scheduled-tier-score.js";
import { TierSchedule, newTierSchedule } from "./tier-schedule.js";

export function summarizeScheduledTierScoresForSchedule(items: ScheduledTierScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTierSchedulesFromScore(items: ScheduledTierScore[]): TierSchedule[] {
  const out: TierSchedule[] = [];
  for (const item of items) {
    const derived = newTierSchedule(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchTierSchedule(item: TierSchedule): number {
  return scheduledTierScoreWeight(8, true);
}
