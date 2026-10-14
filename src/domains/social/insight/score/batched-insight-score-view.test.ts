import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedInsightScoreView, toBatchedInsightScoreViews } from "./batched-insight-score-view.js";
import { newBatchedInsightScore } from "./batched-insight-score.js";

test("BatchedInsightScoreView shows the status in capitals", () => {
  const item = newBatchedInsightScore("code-246", "title-841");
  const view = toBatchedInsightScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedInsightScoreViews([item, item]).length, 2, "views");
});
