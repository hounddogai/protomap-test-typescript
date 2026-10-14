import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalLeaderboardPlanView, toGlobalLeaderboardPlanViews } from "./global-leaderboard-plan-view.js";
import { newGlobalLeaderboardPlan } from "./global-leaderboard-plan.js";

test("GlobalLeaderboardPlanView shows the status in capitals", () => {
  const item = newGlobalLeaderboardPlan("code-889", "name-908");
  const view = toGlobalLeaderboardPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalLeaderboardPlanViews([item, item]).length, 2, "views");
});
