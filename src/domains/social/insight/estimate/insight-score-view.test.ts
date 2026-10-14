import assert from "node:assert/strict";
import { test } from "node:test";
import { toInsightScoreView, toInsightScoreViews } from "./insight-score-view.js";
import { newInsightScore } from "./insight-score.js";

test("InsightScoreView shows the status in capitals", () => {
  const item = newInsightScore("code-299", "title-480");
  const view = toInsightScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInsightScoreViews([item, item]).length, 2, "views");
});
