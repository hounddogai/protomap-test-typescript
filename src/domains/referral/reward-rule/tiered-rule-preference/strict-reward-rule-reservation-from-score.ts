import { classifyScheduledPayoutScore } from "../../payout/score/scheduled-payout-score-policy.js";
import { ScheduledPayoutScore } from "../../payout/score/scheduled-payout-score.js";
import { StrictRewardRuleReservation, newStrictRewardRuleReservation } from "./strict-reward-rule-reservation.js";

export function summarizeScheduledPayoutScoresForReservation(items: ScheduledPayoutScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveStrictRewardRuleReservationsFromScore(items: ScheduledPayoutScore[]): StrictRewardRuleReservation[] {
  const out: StrictRewardRuleReservation[] = [];
  for (const item of items) {
    const derived = newStrictRewardRuleReservation(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileStrictRewardRuleReservation(item: StrictRewardRuleReservation): string {
  return classifyScheduledPayoutScore(item.adjustedVolume());
}
