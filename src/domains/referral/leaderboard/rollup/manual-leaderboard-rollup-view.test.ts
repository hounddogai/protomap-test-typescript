import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualLeaderboardRollupView, toManualLeaderboardRollupViews } from "./manual-leaderboard-rollup-view.js";
import { newManualLeaderboardRollup } from "./manual-leaderboard-rollup.js";

test("ManualLeaderboardRollupView shows the status in capitals", () => {
  const item = newManualLeaderboardRollup("code-434", "name-180");
  const view = toManualLeaderboardRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualLeaderboardRollupViews([item, item]).length, 2, "views");
});
