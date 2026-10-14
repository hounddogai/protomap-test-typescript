import assert from "node:assert/strict";
import { test } from "node:test";
import { toLeaderboardBundleView, toLeaderboardBundleViews } from "./leaderboard-bundle-view.js";
import { newLeaderboardBundle } from "./leaderboard-bundle.js";

test("LeaderboardBundleView shows the status in capitals", () => {
  const item = newLeaderboardBundle("code-551", "label-721");
  const view = toLeaderboardBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLeaderboardBundleViews([item, item]).length, 2, "views");
});
