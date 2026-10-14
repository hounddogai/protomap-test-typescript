import assert from "node:assert/strict";
import { test } from "node:test";
import { toLeaderboardGroupView, toLeaderboardGroupViews } from "./leaderboard-group-view.js";
import { newLeaderboardGroup } from "./leaderboard-group.js";

test("LeaderboardGroupView shows the status in capitals", () => {
  const item = newLeaderboardGroup("code-302", "label-380");
  const view = toLeaderboardGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLeaderboardGroupViews([item, item]).length, 2, "views");
});
