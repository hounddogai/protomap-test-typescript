import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedMacroScoreView, toBatchedMacroScoreViews } from "./batched-macro-score-view.js";
import { newBatchedMacroScore } from "./batched-macro-score.js";

test("BatchedMacroScoreView shows the status in capitals", () => {
  const item = newBatchedMacroScore("code-702", "name-673");
  const view = toBatchedMacroScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedMacroScoreViews([item, item]).length, 2, "views");
});
