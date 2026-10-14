import {
  normalizeGlobalDoubleOptInNoticeCode,
} from "../../double-opt-in/policy/global-double-opt-in-notice-policy.js";
import { GlobalDoubleOptInNotice } from "../../double-opt-in/policy/global-double-opt-in-notice.js";
import { SuppressionAssignment, newSuppressionAssignment } from "./suppression-assignment.js";

export function summarizeGlobalDoubleOptInNoticesForAssignment(items: GlobalDoubleOptInNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveSuppressionAssignmentsFromNotice(items: GlobalDoubleOptInNotice[]): SuppressionAssignment[] {
  const out: SuppressionAssignment[] = [];
  for (const item of items) {
    const derived = newSuppressionAssignment(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function matchSuppressionAssignment(item: SuppressionAssignment): string {
  return normalizeGlobalDoubleOptInNoticeCode(item.code);
}
