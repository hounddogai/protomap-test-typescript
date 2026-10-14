import { classifyGlobalWarmupMilestone } from "../../warmup/warmup-milestone/global-warmup-milestone-policy.js";
import { GlobalWarmupMilestone } from "../../warmup/warmup-milestone/global-warmup-milestone.js";
import { StrictBounceReservation, newStrictBounceReservation } from "./strict-bounce-reservation.js";

export function summarizeGlobalWarmupMilestonesForReservation(items: GlobalWarmupMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveStrictBounceReservationsFromMilestone(items: GlobalWarmupMilestone[]): StrictBounceReservation[] {
  const out: StrictBounceReservation[] = [];
  for (const item of items) {
    const derived = newStrictBounceReservation(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function planStrictBounceReservation(item: StrictBounceReservation): string {
  return classifyGlobalWarmupMilestone(item.measuredValue());
}
