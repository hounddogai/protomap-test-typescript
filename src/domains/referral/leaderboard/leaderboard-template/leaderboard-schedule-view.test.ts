import assert from "node:assert/strict";
import { test } from "node:test";
import { toLeaderboardScheduleView, toLeaderboardScheduleViews } from "./leaderboard-schedule-view.js";
import { newLeaderboardSchedule } from "./leaderboard-schedule.js";

test("LeaderboardScheduleView shows the status in capitals", () => {
  const item = newLeaderboardSchedule("code-159", "label-457");
  const view = toLeaderboardScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLeaderboardScheduleViews([item, item]).length, 2, "views");
});
