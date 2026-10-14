import assert from "node:assert/strict";
import { test } from "node:test";
import { toLeaderboardOverrideView, toLeaderboardOverrideViews } from "./leaderboard-override-view.js";
import { newLeaderboardOverride } from "./leaderboard-override.js";

test("LeaderboardOverrideView shows the status in capitals", () => {
  const item = newLeaderboardOverride("code-397", "label-243");
  const view = toLeaderboardOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLeaderboardOverrideViews([item, item]).length, 2, "views");
});
