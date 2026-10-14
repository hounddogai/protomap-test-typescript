import assert from "node:assert/strict";
import { test } from "node:test";
import { toLeaderboardMilestoneView, toLeaderboardMilestoneViews } from "./leaderboard-milestone-view.js";
import { newLeaderboardMilestone } from "./leaderboard-milestone.js";

test("LeaderboardMilestoneView shows the status in capitals", () => {
  const item = newLeaderboardMilestone("code-841", "label-99");
  const view = toLeaderboardMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLeaderboardMilestoneViews([item, item]).length, 2, "views");
});
