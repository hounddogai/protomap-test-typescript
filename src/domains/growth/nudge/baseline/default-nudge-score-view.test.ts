import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultNudgeScoreView, toDefaultNudgeScoreViews } from "./default-nudge-score-view.js";
import { newDefaultNudgeScore } from "./default-nudge-score.js";

test("DefaultNudgeScoreView shows the status in capitals", () => {
  const item = newDefaultNudgeScore("code-822", "label-646");
  const view = toDefaultNudgeScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultNudgeScoreViews([item, item]).length, 2, "views");
});
