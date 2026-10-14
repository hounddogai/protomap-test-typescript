import assert from "node:assert/strict";
import { test } from "node:test";
import { toLeaderboardNoticeView, toLeaderboardNoticeViews } from "./leaderboard-notice-view.js";
import { newLeaderboardNotice } from "./leaderboard-notice.js";

test("LeaderboardNoticeView shows the status in capitals", () => {
  const item = newLeaderboardNotice("code-975", "label-842");
  const view = toLeaderboardNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLeaderboardNoticeViews([item, item]).length, 2, "views");
});
