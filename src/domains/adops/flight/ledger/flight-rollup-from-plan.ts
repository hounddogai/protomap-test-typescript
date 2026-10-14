import { normalizePendingFrequencyCycleCode } from "../../frequency/cycle/pending-frequency-cycle-policy.js";
import { ScheduledFrequencyPlan } from "../../frequency/cycle/scheduled-frequency-plan.js";
import { FlightRollup, newFlightRollup } from "./flight-rollup.js";

export function summarizeScheduledFrequencyPlansForRollup(items: ScheduledFrequencyPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveFlightRollupsFromPlan(items: ScheduledFrequencyPlan[]): FlightRollup[] {
  const out: FlightRollup[] = [];
  for (const item of items) {
    const derived = newFlightRollup(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveFlightRollup(item: FlightRollup): string {
  return normalizePendingFrequencyCycleCode(item.code);
}
