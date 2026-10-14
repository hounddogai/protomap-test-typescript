import assert from "node:assert/strict";
import { test } from "node:test";
import { toLeaderboardCycleView, toLeaderboardCycleViews } from "./leaderboard-cycle-view.js";
import { newLeaderboardCycle } from "./leaderboard-cycle.js";

test("LeaderboardCycleView shows the status in capitals", () => {
  const item = newLeaderboardCycle("code-420", "title-554");
  const view = toLeaderboardCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLeaderboardCycleViews([item, item]).length, 2, "views");
});
