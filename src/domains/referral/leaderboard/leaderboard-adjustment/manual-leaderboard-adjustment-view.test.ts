import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toManualLeaderboardAdjustmentView,
  toManualLeaderboardAdjustmentViews,
} from "./manual-leaderboard-adjustment-view.js";
import { newManualLeaderboardAdjustment } from "./manual-leaderboard-adjustment.js";

test("ManualLeaderboardAdjustmentView shows the status in capitals", () => {
  const item = newManualLeaderboardAdjustment("code-125", "title-667");
  const view = toManualLeaderboardAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualLeaderboardAdjustmentViews([item, item]).length, 2, "views");
});
