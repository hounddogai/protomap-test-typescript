import assert from "node:assert/strict";
import { test } from "node:test";
import { toLeaderboardRollupView, toLeaderboardRollupViews } from "./leaderboard-rollup-view.js";
import { newLeaderboardRollup } from "./leaderboard-rollup.js";

test("LeaderboardRollupView shows the status in capitals", () => {
  const item = newLeaderboardRollup("code-103", "title-983");
  const view = toLeaderboardRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLeaderboardRollupViews([item, item]).length, 2, "views");
});
