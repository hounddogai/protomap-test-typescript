import {
  adaptiveFraudCheckScoreWeight,
} from "../../fraud-check/batched-check-score/adaptive-fraud-check-score-policy.js";
import { GlobalFraudCheckSlot } from "../../fraud-check/batched-check-score/global-fraud-check-slot.js";
import { StrictLeaderboardAgreement, newStrictLeaderboardAgreement } from "./strict-leaderboard-agreement.js";

export function summarizeGlobalFraudCheckSlotsForAgreement(items: GlobalFraudCheckSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveStrictLeaderboardAgreementsFromSlot(items: GlobalFraudCheckSlot[]): StrictLeaderboardAgreement[] {
  const out: StrictLeaderboardAgreement[] = [];
  for (const item of items) {
    const derived = newStrictLeaderboardAgreement(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyStrictLeaderboardAgreement(item: StrictLeaderboardAgreement): number {
  return adaptiveFraudCheckScoreWeight(7, true);
}
