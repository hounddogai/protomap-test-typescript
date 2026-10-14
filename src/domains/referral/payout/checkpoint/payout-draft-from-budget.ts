import { normalizeLeaderboardBudgetCode } from "../../leaderboard/policy/leaderboard-budget-policy.js";
import { LeaderboardBudget } from "../../leaderboard/policy/leaderboard-budget.js";
import { PayoutDraft, newPayoutDraft } from "./payout-draft.js";

export function summarizeLeaderboardBudgetsForDraft(items: LeaderboardBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePayoutDraftsFromBudget(items: LeaderboardBudget[]): PayoutDraft[] {
  const out: PayoutDraft[] = [];
  for (const item of items) {
    const derived = newPayoutDraft(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyPayoutDraft(item: PayoutDraft): string {
  return normalizeLeaderboardBudgetCode(item.code);
}
