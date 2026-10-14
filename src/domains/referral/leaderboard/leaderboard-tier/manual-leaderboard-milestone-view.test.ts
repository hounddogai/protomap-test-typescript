import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toManualLeaderboardMilestoneView,
  toManualLeaderboardMilestoneViews,
} from "./manual-leaderboard-milestone-view.js";
import { newManualLeaderboardMilestone } from "./manual-leaderboard-milestone.js";

test("ManualLeaderboardMilestoneView shows the status in capitals", () => {
  const item = newManualLeaderboardMilestone("code-371", "name-538");
  const view = toManualLeaderboardMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualLeaderboardMilestoneViews([item, item]).length, 2, "views");
});
