import { normalizeWaitGroupCode } from "../../wait/rule/wait-group-policy.js";
import { WaitGroup } from "../../wait/rule/wait-group.js";
import { EnrollmentRequest, newEnrollmentRequest } from "./enrollment-request.js";

export function summarizeWaitGroupsForRequest(items: WaitGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveEnrollmentRequestsFromGroup(items: WaitGroup[]): EnrollmentRequest[] {
  const out: EnrollmentRequest[] = [];
  for (const item of items) {
    const derived = newEnrollmentRequest(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreEnrollmentRequest(item: EnrollmentRequest): string {
  return normalizeWaitGroupCode(item.code);
}
