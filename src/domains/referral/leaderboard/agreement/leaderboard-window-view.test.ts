import assert from "node:assert/strict";
import { test } from "node:test";
import { toLeaderboardWindowView, toLeaderboardWindowViews } from "./leaderboard-window-view.js";
import { newLeaderboardWindow } from "./leaderboard-window.js";

test("LeaderboardWindowView shows the status in capitals", () => {
  const item = newLeaderboardWindow("code-21", "name-608");
  const view = toLeaderboardWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLeaderboardWindowViews([item, item]).length, 2, "views");
});
