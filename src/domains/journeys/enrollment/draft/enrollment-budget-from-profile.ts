import { waitProfileBucket } from "../../wait/policy/wait-profile-policy.js";
import { WaitProfile } from "../../wait/policy/wait-profile.js";
import { EnrollmentBudget, newEnrollmentBudget } from "./enrollment-budget.js";

export function summarizeWaitProfilesForBudget(items: WaitProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveEnrollmentBudgetsFromProfile(items: WaitProfile[]): EnrollmentBudget[] {
  const out: EnrollmentBudget[] = [];
  for (const item of items) {
    const derived = newEnrollmentBudget(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function computeEnrollmentBudget(item: EnrollmentBudget): string {
  return waitProfileBucket(item.projectedValue());
}
