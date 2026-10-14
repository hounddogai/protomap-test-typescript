import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPendingLeaderboardOverrideView,
  toPendingLeaderboardOverrideViews,
} from "./pending-leaderboard-override-view.js";
import { newPendingLeaderboardOverride } from "./pending-leaderboard-override.js";

test("PendingLeaderboardOverrideView shows the status in capitals", () => {
  const item = newPendingLeaderboardOverride("code-299", "label-918");
  const view = toPendingLeaderboardOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingLeaderboardOverrideViews([item, item]).length, 2, "views");
});
