import { DeflectionAllocation } from "../../deflection/assignment/deflection-allocation.js";
import { deflectionNoticeBucket } from "../../deflection/assignment/deflection-notice-policy.js";
import { EscalationNotice, newEscalationNotice } from "./escalation-notice.js";

export function summarizeDeflectionAllocationsForNotice(items: DeflectionAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveEscalationNoticesFromAllocation(items: DeflectionAllocation[]): EscalationNotice[] {
  const out: EscalationNotice[] = [];
  for (const item of items) {
    const derived = newEscalationNotice(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function matchEscalationNotice(item: EscalationNotice): string {
  return deflectionNoticeBucket(item.measuredValue());
}
