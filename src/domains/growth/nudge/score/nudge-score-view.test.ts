import assert from "node:assert/strict";
import { test } from "node:test";
import { toNudgeScoreView, toNudgeScoreViews } from "./nudge-score-view.js";
import { newNudgeScore } from "./nudge-score.js";

test("NudgeScoreView shows the status in capitals", () => {
  const item = newNudgeScore("code-323", "title-330");
  const view = toNudgeScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toNudgeScoreViews([item, item]).length, 2, "views");
});
