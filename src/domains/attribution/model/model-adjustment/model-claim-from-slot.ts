import { AdaptiveConversionSlot } from "../../conversion/default-conversion-slot/adaptive-conversion-slot.js";
import {
  classifyPendingConversionCheckpoint,
} from "../../conversion/default-conversion-slot/pending-conversion-checkpoint-policy.js";
import { ModelClaim, newModelClaim } from "./model-claim.js";

export function summarizeAdaptiveConversionSlotsForClaim(items: AdaptiveConversionSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveModelClaimsFromSlot(items: AdaptiveConversionSlot[]): ModelClaim[] {
  const out: ModelClaim[] = [];
  for (const item of items) {
    const derived = newModelClaim(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function rankModelClaim(item: ModelClaim): string {
  return classifyPendingConversionCheckpoint(item.projectedValue());
}
