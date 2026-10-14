import { exitRuleEntryWeight } from "../../exit-rule/mapping/exit-rule-entry-policy.js";
import { ExitRuleEntry } from "../../exit-rule/mapping/exit-rule-entry.js";
import { EnrollmentRequest, newEnrollmentRequest } from "./enrollment-request.js";

export function summarizeExitRuleEntriesForRequest(items: ExitRuleEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveEnrollmentRequestsFromEntry(items: ExitRuleEntry[]): EnrollmentRequest[] {
  const out: EnrollmentRequest[] = [];
  for (const item of items) {
    const derived = newEnrollmentRequest(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignEnrollmentRequest(item: EnrollmentRequest): number {
  return exitRuleEntryWeight(6, true);
}
