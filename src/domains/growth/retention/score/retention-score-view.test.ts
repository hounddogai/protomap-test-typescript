import assert from "node:assert/strict";
import { test } from "node:test";
import { toRetentionScoreView, toRetentionScoreViews } from "./retention-score-view.js";
import { newRetentionScore } from "./retention-score.js";

test("RetentionScoreView shows the status in capitals", () => {
  const item = newRetentionScore("code-297", "label-874");
  const view = toRetentionScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRetentionScoreViews([item, item]).length, 2, "views");
});
