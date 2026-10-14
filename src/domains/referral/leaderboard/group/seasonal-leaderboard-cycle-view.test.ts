import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalLeaderboardCycleView,
  toSeasonalLeaderboardCycleViews,
} from "./seasonal-leaderboard-cycle-view.js";
import { newSeasonalLeaderboardCycle } from "./seasonal-leaderboard-cycle.js";

test("SeasonalLeaderboardCycleView shows the status in capitals", () => {
  const item = newSeasonalLeaderboardCycle("code-574", "label-575");
  const view = toSeasonalLeaderboardCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalLeaderboardCycleViews([item, item]).length, 2, "views");
});
