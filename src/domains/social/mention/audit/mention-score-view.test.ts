import assert from "node:assert/strict";
import { test } from "node:test";
import { toMentionScoreView, toMentionScoreViews } from "./mention-score-view.js";
import { newMentionScore } from "./mention-score.js";

test("MentionScoreView shows the status in capitals", () => {
  const item = newMentionScore("code-511", "label-623");
  const view = toMentionScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMentionScoreViews([item, item]).length, 2, "views");
});
