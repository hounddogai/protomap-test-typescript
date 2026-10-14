import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingLeaderboardDraftView, toRollingLeaderboardDraftViews } from "./rolling-leaderboard-draft-view.js";
import { newRollingLeaderboardDraft } from "./rolling-leaderboard-draft.js";

test("RollingLeaderboardDraftView shows the status in capitals", () => {
  const item = newRollingLeaderboardDraft("code-684", "title-348");
  const view = toRollingLeaderboardDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingLeaderboardDraftViews([item, item]).length, 2, "views");
});
