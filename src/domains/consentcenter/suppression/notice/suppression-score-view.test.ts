import assert from "node:assert/strict";
import { test } from "node:test";
import { toSuppressionScoreView, toSuppressionScoreViews } from "./suppression-score-view.js";
import { newSuppressionScore } from "./suppression-score.js";

test("SuppressionScoreView shows the status in capitals", () => {
  const item = newSuppressionScore("code-985", "label-637");
  const view = toSuppressionScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSuppressionScoreViews([item, item]).length, 2, "views");
});
