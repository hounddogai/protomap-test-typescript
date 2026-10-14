import assert from "node:assert/strict";
import { test } from "node:test";
import { toModelScoreView, toModelScoreViews } from "./model-score-view.js";
import { newModelScore } from "./model-score.js";

test("ModelScoreView shows the status in capitals", () => {
  const item = newModelScore("code-300", "label-528");
  const view = toModelScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toModelScoreViews([item, item]).length, 2, "views");
});
