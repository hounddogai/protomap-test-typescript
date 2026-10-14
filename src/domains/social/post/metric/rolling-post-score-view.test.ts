import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingPostScoreView, toRollingPostScoreViews } from "./rolling-post-score-view.js";
import { newRollingPostScore } from "./rolling-post-score.js";

test("RollingPostScoreView shows the status in capitals", () => {
  const item = newRollingPostScore("code-155", "title-748");
  const view = toRollingPostScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingPostScoreViews([item, item]).length, 2, "views");
});
