import { strictRewardPreferenceBucket } from "../../reward/reward-preference/strict-reward-preference-policy.js";
import { WeightedRewardTemplate } from "../../reward/reward-preference/weighted-reward-template.js";
import {
  ScheduledRedemptionReservation,
  newScheduledRedemptionReservation,
} from "./scheduled-redemption-reservation.js";

export function summarizeWeightedRewardTemplatesForReservation(items: WeightedRewardTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveScheduledRedemptionReservationsFromTemplate(items: WeightedRewardTemplate[]): ScheduledRedemptionReservation[] {
  const out: ScheduledRedemptionReservation[] = [];
  for (const item of items) {
    const derived = newScheduledRedemptionReservation(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveScheduledRedemptionReservation(item: ScheduledRedemptionReservation): string {
  return strictRewardPreferenceBucket(item.adjustedLoad());
}
