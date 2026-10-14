import { DeflectionEstimate } from "../../deflection/allocation/deflection-estimate.js";
import { primaryDeflectionCycleWeight } from "../../deflection/allocation/primary-deflection-cycle-policy.js";
import { EscalationCheckpoint, newEscalationCheckpoint } from "./escalation-checkpoint.js";

export function summarizeDeflectionEstimatesForCheckpoint(items: DeflectionEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveEscalationCheckpointsFromEstimate(items: DeflectionEstimate[]): EscalationCheckpoint[] {
  const out: EscalationCheckpoint[] = [];
  for (const item of items) {
    const derived = newEscalationCheckpoint(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateEscalationCheckpoint(item: EscalationCheckpoint): number {
  return primaryDeflectionCycleWeight(3, true);
}
