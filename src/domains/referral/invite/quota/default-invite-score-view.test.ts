import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultInviteScoreView, toDefaultInviteScoreViews } from "./default-invite-score-view.js";
import { newDefaultInviteScore } from "./default-invite-score.js";

test("DefaultInviteScoreView shows the status in capitals", () => {
  const item = newDefaultInviteScore("code-956", "title-876");
  const view = toDefaultInviteScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultInviteScoreViews([item, item]).length, 2, "views");
});
