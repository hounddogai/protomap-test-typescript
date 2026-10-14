import {
  classifyDefaultPreferenceNotice,
} from "../../preference/preference-schedule/default-preference-notice-policy.js";
import { RollingPreferenceSchedule } from "../../preference/preference-schedule/rolling-preference-schedule.js";
import { DoubleOptInAssignment, newDoubleOptInAssignment } from "./double-opt-in-assignment.js";

export function summarizeRollingPreferenceSchedulesForAssignment(items: RollingPreferenceSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveDoubleOptInAssignmentsFromSchedule(items: RollingPreferenceSchedule[]): DoubleOptInAssignment[] {
  const out: DoubleOptInAssignment[] = [];
  for (const item of items) {
    const derived = newDoubleOptInAssignment(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function settleDoubleOptInAssignment(item: DoubleOptInAssignment): string {
  return classifyDefaultPreferenceNotice(item.netLoad());
}
