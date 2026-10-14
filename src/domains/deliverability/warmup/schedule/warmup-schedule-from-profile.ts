import { cappedSenderProfileWeight } from "../../sender/sender-rollup/capped-sender-profile-policy.js";
import { CappedSenderProfile } from "../../sender/sender-rollup/capped-sender-profile.js";
import { WarmupSchedule, newWarmupSchedule } from "./warmup-schedule.js";

export function summarizeCappedSenderProfilesForSchedule(items: CappedSenderProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveWarmupSchedulesFromProfile(items: CappedSenderProfile[]): WarmupSchedule[] {
  const out: WarmupSchedule[] = [];
  for (const item of items) {
    const derived = newWarmupSchedule(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateWarmupSchedule(item: WarmupSchedule): number {
  return cappedSenderProfileWeight(7, true);
}
