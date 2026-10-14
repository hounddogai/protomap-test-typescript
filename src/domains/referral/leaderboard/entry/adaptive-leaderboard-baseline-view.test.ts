import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveLeaderboardBaselineView,
  toAdaptiveLeaderboardBaselineViews,
} from "./adaptive-leaderboard-baseline-view.js";
import { newAdaptiveLeaderboardBaseline } from "./adaptive-leaderboard-baseline.js";

test("AdaptiveLeaderboardBaselineView shows the status in capitals", () => {
  const item = newAdaptiveLeaderboardBaseline("code-913", "name-397");
  const view = toAdaptiveLeaderboardBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveLeaderboardBaselineViews([item, item]).length, 2, "views");
});
