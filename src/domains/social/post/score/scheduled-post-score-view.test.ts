import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledPostScoreView, toScheduledPostScoreViews } from "./scheduled-post-score-view.js";
import { newScheduledPostScore } from "./scheduled-post-score.js";

test("ScheduledPostScoreView shows the status in capitals", () => {
  const item = newScheduledPostScore("code-320", "title-815");
  const view = toScheduledPostScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledPostScoreViews([item, item]).length, 2, "views");
});
