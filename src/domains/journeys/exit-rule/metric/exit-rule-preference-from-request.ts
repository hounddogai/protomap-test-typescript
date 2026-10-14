import { classifyEnrollmentGroup } from "../../enrollment/group/enrollment-group-policy.js";
import { EnrollmentRequest } from "../../enrollment/group/enrollment-request.js";
import { ExitRulePreference, newExitRulePreference } from "./exit-rule-preference.js";

export function summarizeEnrollmentRequestsForPreference(items: EnrollmentRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveExitRulePreferencesFromRequest(items: EnrollmentRequest[]): ExitRulePreference[] {
  const out: ExitRulePreference[] = [];
  for (const item of items) {
    const derived = newExitRulePreference(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyExitRulePreference(item: ExitRulePreference): string {
  return classifyEnrollmentGroup(item.netTotal());
}
