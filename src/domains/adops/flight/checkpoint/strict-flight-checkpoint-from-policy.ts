import {
  lenientPlacementPolicyWeight,
} from "../../placement/placement-adjustment/lenient-placement-policy-policy.js";
import { LenientPlacementPolicy } from "../../placement/placement-adjustment/lenient-placement-policy.js";
import { StrictFlightCheckpoint, newStrictFlightCheckpoint } from "./strict-flight-checkpoint.js";

export function summarizeLenientPlacementPoliciesForCheckpoint(items: LenientPlacementPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveStrictFlightCheckpointsFromPolicy(items: LenientPlacementPolicy[]): StrictFlightCheckpoint[] {
  const out: StrictFlightCheckpoint[] = [];
  for (const item of items) {
    const derived = newStrictFlightCheckpoint(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function projectStrictFlightCheckpoint(item: StrictFlightCheckpoint): number {
  return lenientPlacementPolicyWeight(9, true);
}
