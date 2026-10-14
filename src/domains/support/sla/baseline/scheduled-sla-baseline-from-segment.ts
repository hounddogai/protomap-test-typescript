import { normalizeDefaultMacroSnapshotCode } from "../../macro/macro-snapshot/default-macro-snapshot-policy.js";
import { SeasonalMacroSegment } from "../../macro/macro-snapshot/seasonal-macro-segment.js";
import { ScheduledSlaBaseline, newScheduledSlaBaseline } from "./scheduled-sla-baseline.js";

export function summarizeSeasonalMacroSegmentsForBaseline(items: SeasonalMacroSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveScheduledSlaBaselinesFromSegment(items: SeasonalMacroSegment[]): ScheduledSlaBaseline[] {
  const out: ScheduledSlaBaseline[] = [];
  for (const item of items) {
    const derived = newScheduledSlaBaseline(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function settleScheduledSlaBaseline(item: ScheduledSlaBaseline): string {
  return normalizeDefaultMacroSnapshotCode(item.code);
}
