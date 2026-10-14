import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedLeaderboardNoticeView, toCappedLeaderboardNoticeViews } from "./capped-leaderboard-notice-view.js";
import { newCappedLeaderboardNotice } from "./capped-leaderboard-notice.js";

test("CappedLeaderboardNoticeView shows the status in capitals", () => {
  const item = newCappedLeaderboardNotice("code-448", "label-446");
  const view = toCappedLeaderboardNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedLeaderboardNoticeViews([item, item]).length, 2, "views");
});
