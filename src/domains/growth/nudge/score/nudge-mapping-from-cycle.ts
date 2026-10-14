import { ActivationCycle } from "../../activation/reservation/activation-cycle.js";
import { activationReservationWeight } from "../../activation/reservation/activation-reservation-policy.js";
import { NudgeMapping, newNudgeMapping } from "./nudge-mapping.js";

export function summarizeActivationCyclesForMapping(items: ActivationCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveNudgeMappingsFromCycle(items: ActivationCycle[]): NudgeMapping[] {
  const out: NudgeMapping[] = [];
  for (const item of items) {
    const derived = newNudgeMapping(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveNudgeMapping(item: NudgeMapping): number {
  return activationReservationWeight(1, true);
}
