import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultPostScoreView, toDefaultPostScoreViews } from "./default-post-score-view.js";
import { newDefaultPostScore } from "./default-post-score.js";

test("DefaultPostScoreView shows the status in capitals", () => {
  const item = newDefaultPostScore("code-962", "name-316");
  const view = toDefaultPostScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultPostScoreViews([item, item]).length, 2, "views");
});
