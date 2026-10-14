import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPendingLeaderboardSummaryView,
  toPendingLeaderboardSummaryViews,
} from "./pending-leaderboard-summary-view.js";
import { newPendingLeaderboardSummary } from "./pending-leaderboard-summary.js";

test("PendingLeaderboardSummaryView shows the status in capitals", () => {
  const item = newPendingLeaderboardSummary("code-915", "title-584");
  const view = toPendingLeaderboardSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingLeaderboardSummaryViews([item, item]).length, 2, "views");
});
