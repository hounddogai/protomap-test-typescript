import assert from "node:assert/strict";
import { test } from "node:test";
import { toLeaderboardBudgetView, toLeaderboardBudgetViews } from "./leaderboard-budget-view.js";
import { newLeaderboardBudget } from "./leaderboard-budget.js";

test("LeaderboardBudgetView shows the status in capitals", () => {
  const item = newLeaderboardBudget("code-714", "name-69");
  const view = toLeaderboardBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLeaderboardBudgetViews([item, item]).length, 2, "views");
});
