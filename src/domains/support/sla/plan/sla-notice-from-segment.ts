import { defaultMacroSegmentWeight } from "../../macro/segment/default-macro-segment-policy.js";
import { MacroSegment } from "../../macro/segment/macro-segment.js";
import { SlaNotice, newSlaNotice } from "./sla-notice.js";

export function summarizeMacroSegmentsForNotice(items: MacroSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveSlaNoticesFromSegment(items: MacroSegment[]): SlaNotice[] {
  const out: SlaNotice[] = [];
  for (const item of items) {
    const derived = newSlaNotice(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectSlaNotice(item: SlaNotice): number {
  return defaultMacroSegmentWeight(5, true);
}
