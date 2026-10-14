import { StepClaim } from "../../step/claim/step-claim.js";
import { stepExceptionWeight } from "../../step/claim/step-exception-policy.js";
import { RollingJourneySlot, newRollingJourneySlot } from "./rolling-journey-slot.js";

export function summarizeStepClaimsForSlot(items: StepClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveRollingJourneySlotsFromClaim(items: StepClaim[]): RollingJourneySlot[] {
  const out: RollingJourneySlot[] = [];
  for (const item of items) {
    const derived = newRollingJourneySlot(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateRollingJourneySlot(item: RollingJourneySlot): number {
  return stepExceptionWeight(7, true);
}
