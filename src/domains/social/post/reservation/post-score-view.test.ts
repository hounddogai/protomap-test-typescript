import assert from "node:assert/strict";
import { test } from "node:test";
import { toPostScoreView, toPostScoreViews } from "./post-score-view.js";
import { newPostScore } from "./post-score.js";

test("PostScoreView shows the status in capitals", () => {
  const item = newPostScore("code-939", "title-968");
  const view = toPostScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPostScoreViews([item, item]).length, 2, "views");
});
