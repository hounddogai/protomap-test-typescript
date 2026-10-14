import assert from "node:assert/strict";
import { test } from "node:test";
import { toLeaderboardDraftView, toLeaderboardDraftViews } from "./leaderboard-draft-view.js";
import { newLeaderboardDraft } from "./leaderboard-draft.js";

test("LeaderboardDraftView shows the status in capitals", () => {
  const item = newLeaderboardDraft("code-924", "label-693");
  const view = toLeaderboardDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLeaderboardDraftViews([item, item]).length, 2, "views");
});
