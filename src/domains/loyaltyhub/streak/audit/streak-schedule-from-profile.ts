import { normalizeLenientRewardProfileCode } from "../../reward/cycle/lenient-reward-profile-policy.js";
import { LenientRewardProfile } from "../../reward/cycle/lenient-reward-profile.js";
import { StreakSchedule, newStreakSchedule } from "./streak-schedule.js";

export function summarizeLenientRewardProfilesForSchedule(items: LenientRewardProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveStreakSchedulesFromProfile(items: LenientRewardProfile[]): StreakSchedule[] {
  const out: StreakSchedule[] = [];
  for (const item of items) {
    const derived = newStreakSchedule(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeStreakSchedule(item: StreakSchedule): string {
  return normalizeLenientRewardProfileCode(item.code);
}
