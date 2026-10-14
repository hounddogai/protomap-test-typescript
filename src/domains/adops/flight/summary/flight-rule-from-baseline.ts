import { classifyPacingBaseline } from "../../pacing/audit/pacing-baseline-policy.js";
import { PacingBaseline } from "../../pacing/audit/pacing-baseline.js";
import { FlightRule, newFlightRule } from "./flight-rule.js";

export function summarizePacingBaselinesForRule(items: PacingBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveFlightRulesFromBaseline(items: PacingBaseline[]): FlightRule[] {
  const out: FlightRule[] = [];
  for (const item of items) {
    const derived = newFlightRule(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileFlightRule(item: FlightRule): string {
  return classifyPacingBaseline(item.weightedTotal());
}
