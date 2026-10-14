import { SlaNotice } from "../../sla/plan/sla-notice.js";
import { slaPlanWeight } from "../../sla/plan/sla-plan-policy.js";
import { DeflectionSegment, newDeflectionSegment } from "./deflection-segment.js";

export function summarizeSlaNoticesForSegment(items: SlaNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveDeflectionSegmentsFromNotice(items: SlaNotice[]): DeflectionSegment[] {
  const out: DeflectionSegment[] = [];
  for (const item of items) {
    const derived = newDeflectionSegment(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function applyDeflectionSegment(item: DeflectionSegment): number {
  return slaPlanWeight(2, true);
}
