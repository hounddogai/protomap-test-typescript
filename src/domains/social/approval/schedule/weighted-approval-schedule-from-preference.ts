import { classifyMentionPreference } from "../../mention/preference/mention-preference-policy.js";
import { MentionPreference } from "../../mention/preference/mention-preference.js";
import { WeightedApprovalSchedule, newWeightedApprovalSchedule } from "./weighted-approval-schedule.js";

export function summarizeMentionPreferencesForSchedule(items: MentionPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveWeightedApprovalSchedulesFromPreference(items: MentionPreference[]): WeightedApprovalSchedule[] {
  const out: WeightedApprovalSchedule[] = [];
  for (const item of items) {
    const derived = newWeightedApprovalSchedule(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreWeightedApprovalSchedule(item: WeightedApprovalSchedule): string {
  return classifyMentionPreference(item.weightedExposure());
}
