import { normalizeLeaderboardBudgetCode } from "../../leaderboard/policy/leaderboard-budget-policy.js";
import { SeasonalLeaderboardAgreement } from "../../leaderboard/policy/seasonal-leaderboard-agreement.js";
import { PrimaryFraudCheckAssignment, newPrimaryFraudCheckAssignment } from "./primary-fraud-check-assignment.js";

export function summarizeSeasonalLeaderboardAgreementsForAssignment(items: SeasonalLeaderboardAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function derivePrimaryFraudCheckAssignmentsFromAgreement(items: SeasonalLeaderboardAgreement[]): PrimaryFraudCheckAssignment[] {
  const out: PrimaryFraudCheckAssignment[] = [];
  for (const item of items) {
    const derived = newPrimaryFraudCheckAssignment(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function allocatePrimaryFraudCheckAssignment(item: PrimaryFraudCheckAssignment): string {
  return normalizeLeaderboardBudgetCode(item.code);
}
