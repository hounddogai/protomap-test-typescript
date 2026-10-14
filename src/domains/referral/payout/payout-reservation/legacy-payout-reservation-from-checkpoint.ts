import {
  normalizeFallbackRewardRuleRequestCode,
} from "../../reward-rule/rule-summary/fallback-reward-rule-request-policy.js";
import { LenientRewardRuleCheckpoint } from "../../reward-rule/rule-summary/lenient-reward-rule-checkpoint.js";
import { LegacyPayoutReservation, newLegacyPayoutReservation } from "./legacy-payout-reservation.js";

export function summarizeLenientRewardRuleCheckpointsForReservation(items: LenientRewardRuleCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveLegacyPayoutReservationsFromCheckpoint(items: LenientRewardRuleCheckpoint[]): LegacyPayoutReservation[] {
  const out: LegacyPayoutReservation[] = [];
  for (const item of items) {
    const derived = newLegacyPayoutReservation(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeLegacyPayoutReservation(item: LegacyPayoutReservation): string {
  return normalizeFallbackRewardRuleRequestCode(item.code);
}
