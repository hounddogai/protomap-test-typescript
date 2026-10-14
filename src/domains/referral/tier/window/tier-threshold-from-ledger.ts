import {
  normalizeLenientRewardRuleReservationCode,
} from "../../reward-rule/estimate/lenient-reward-rule-reservation-policy.js";
import { RewardRuleLedger } from "../../reward-rule/estimate/reward-rule-ledger.js";
import { TierThreshold, newTierThreshold } from "./tier-threshold.js";

export function summarizeRewardRuleLedgersForThreshold(items: RewardRuleLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTierThresholdsFromLedger(items: RewardRuleLedger[]): TierThreshold[] {
  const out: TierThreshold[] = [];
  for (const item of items) {
    const derived = newTierThreshold(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function computeTierThreshold(item: TierThreshold): string {
  return normalizeLenientRewardRuleReservationCode(item.code);
}
