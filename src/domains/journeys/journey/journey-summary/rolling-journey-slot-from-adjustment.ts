import { classifySeasonalWaitAdjustment } from "../../wait/adjustment/seasonal-wait-adjustment-policy.js";
import { WaitAdjustment } from "../../wait/adjustment/wait-adjustment.js";
import { RollingJourneySlot, newRollingJourneySlot } from "./rolling-journey-slot.js";

export function summarizeWaitAdjustmentsForSlot(items: WaitAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveRollingJourneySlotsFromAdjustment(items: WaitAdjustment[]): RollingJourneySlot[] {
  const out: RollingJourneySlot[] = [];
  for (const item of items) {
    const derived = newRollingJourneySlot(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileRollingJourneySlot(item: RollingJourneySlot): string {
  return classifySeasonalWaitAdjustment(item.netVolume());
}
