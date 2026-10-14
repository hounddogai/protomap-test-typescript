import assert from "node:assert/strict";
import { test } from "node:test";
import { toLeaderboardEstimateView, toLeaderboardEstimateViews } from "./leaderboard-estimate-view.js";
import { newLeaderboardEstimate } from "./leaderboard-estimate.js";

test("LeaderboardEstimateView shows the status in capitals", () => {
  const item = newLeaderboardEstimate("code-985", "label-644");
  const view = toLeaderboardEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLeaderboardEstimateViews([item, item]).length, 2, "views");
});
