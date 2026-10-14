import { RollingWaitProfile } from "../../wait/wait-snapshot/rolling-wait-profile.js";
import { classifySeasonalWaitSchedule } from "../../wait/wait-snapshot/seasonal-wait-schedule-policy.js";
import { DefaultEnrollmentDigest, newDefaultEnrollmentDigest } from "./default-enrollment-digest.js";

export function summarizeRollingWaitProfilesForDigest(items: RollingWaitProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveDefaultEnrollmentDigestsFromProfile(items: RollingWaitProfile[]): DefaultEnrollmentDigest[] {
  const out: DefaultEnrollmentDigest[] = [];
  for (const item of items) {
    const derived = newDefaultEnrollmentDigest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function applyDefaultEnrollmentDigest(item: DefaultEnrollmentDigest): string {
  return classifySeasonalWaitSchedule(item.adjustedTotal());
}
