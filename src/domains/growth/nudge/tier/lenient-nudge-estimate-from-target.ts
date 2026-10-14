import { manualFunnelScheduleWeight } from "../../funnel/funnel-override/manual-funnel-schedule-policy.js";
import { PrimaryFunnelTarget } from "../../funnel/funnel-override/primary-funnel-target.js";
import { LenientNudgeEstimate, newLenientNudgeEstimate } from "./lenient-nudge-estimate.js";

export function summarizePrimaryFunnelTargetsForEstimate(items: PrimaryFunnelTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveLenientNudgeEstimatesFromTarget(items: PrimaryFunnelTarget[]): LenientNudgeEstimate[] {
  const out: LenientNudgeEstimate[] = [];
  for (const item of items) {
    const derived = newLenientNudgeEstimate(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectLenientNudgeEstimate(item: LenientNudgeEstimate): number {
  return manualFunnelScheduleWeight(4, true);
}
