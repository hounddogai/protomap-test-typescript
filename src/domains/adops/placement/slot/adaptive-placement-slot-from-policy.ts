import { normalizeFrequencyPolicyCode } from "../../frequency/frequency-review/frequency-policy-policy.js";
import { FrequencyPolicy } from "../../frequency/frequency-review/frequency-policy.js";
import { AdaptivePlacementSlot, newAdaptivePlacementSlot } from "./adaptive-placement-slot.js";

export function summarizeFrequencyPoliciesForSlot(items: FrequencyPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveAdaptivePlacementSlotsFromPolicy(items: FrequencyPolicy[]): AdaptivePlacementSlot[] {
  const out: AdaptivePlacementSlot[] = [];
  for (const item of items) {
    const derived = newAdaptivePlacementSlot(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateAdaptivePlacementSlot(item: AdaptivePlacementSlot): string {
  return normalizeFrequencyPolicyCode(item.code);
}
