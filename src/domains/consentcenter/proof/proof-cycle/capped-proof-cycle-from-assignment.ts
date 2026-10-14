import {
  normalizeGlobalSuppressionCheckpointCode,
} from "../../suppression/suppression-checkpoint/global-suppression-checkpoint-policy.js";
import { SuppressionAssignment } from "../../suppression/suppression-checkpoint/suppression-assignment.js";
import { CappedProofCycle, newCappedProofCycle } from "./capped-proof-cycle.js";

export function summarizeSuppressionAssignmentsForCycle(items: SuppressionAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveCappedProofCyclesFromAssignment(items: SuppressionAssignment[]): CappedProofCycle[] {
  const out: CappedProofCycle[] = [];
  for (const item of items) {
    const derived = newCappedProofCycle(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateCappedProofCycle(item: CappedProofCycle): string {
  return normalizeGlobalSuppressionCheckpointCode(item.code);
}
