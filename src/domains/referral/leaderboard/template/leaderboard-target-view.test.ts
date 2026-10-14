import assert from "node:assert/strict";
import { test } from "node:test";
import { toLeaderboardTargetView, toLeaderboardTargetViews } from "./leaderboard-target-view.js";
import { newLeaderboardTarget } from "./leaderboard-target.js";

test("LeaderboardTargetView shows the status in capitals", () => {
  const item = newLeaderboardTarget("code-559", "label-926");
  const view = toLeaderboardTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLeaderboardTargetViews([item, item]).length, 2, "views");
});
