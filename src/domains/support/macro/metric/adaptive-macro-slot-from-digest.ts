import {
  weightedEscalationAdjustmentBucket,
} from "../../escalation/escalation-adjustment/weighted-escalation-adjustment-policy.js";
import { WeightedEscalationDigest } from "../../escalation/escalation-adjustment/weighted-escalation-digest.js";
import { AdaptiveMacroSlot, newAdaptiveMacroSlot } from "./adaptive-macro-slot.js";

export function summarizeWeightedEscalationDigestsForSlot(items: WeightedEscalationDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveAdaptiveMacroSlotsFromDigest(items: WeightedEscalationDigest[]): AdaptiveMacroSlot[] {
  const out: AdaptiveMacroSlot[] = [];
  for (const item of items) {
    const derived = newAdaptiveMacroSlot(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitAdaptiveMacroSlot(item: AdaptiveMacroSlot): string {
  return weightedEscalationAdjustmentBucket(item.effectiveValue());
}
