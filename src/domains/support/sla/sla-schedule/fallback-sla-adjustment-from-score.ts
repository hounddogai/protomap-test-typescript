import { classifyDeflectionClaim } from "../../deflection/score/deflection-claim-policy.js";
import { ScheduledDeflectionScore } from "../../deflection/score/scheduled-deflection-score.js";
import { FallbackSlaAdjustment, newFallbackSlaAdjustment } from "./fallback-sla-adjustment.js";

export function summarizeScheduledDeflectionScoresForAdjustment(items: ScheduledDeflectionScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveFallbackSlaAdjustmentsFromScore(items: ScheduledDeflectionScore[]): FallbackSlaAdjustment[] {
  const out: FallbackSlaAdjustment[] = [];
  for (const item of items) {
    const derived = newFallbackSlaAdjustment(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planFallbackSlaAdjustment(item: FallbackSlaAdjustment): string {
  return classifyDeflectionClaim(item.netTotal());
}
