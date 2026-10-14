import { classifyRegionalRedemptionEntry } from "../../redemption/reservation/regional-redemption-entry-policy.js";
import { RegionalRedemptionEntry } from "../../redemption/reservation/regional-redemption-entry.js";
import { ChallengeSchedule, newChallengeSchedule } from "./challenge-schedule.js";

export function summarizeRegionalRedemptionEntriesForSchedule(items: RegionalRedemptionEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveChallengeSchedulesFromEntry(items: RegionalRedemptionEntry[]): ChallengeSchedule[] {
  const out: ChallengeSchedule[] = [];
  for (const item of items) {
    const derived = newChallengeSchedule(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveChallengeSchedule(item: ChallengeSchedule): string {
  return classifyRegionalRedemptionEntry(item.netLoad());
}
