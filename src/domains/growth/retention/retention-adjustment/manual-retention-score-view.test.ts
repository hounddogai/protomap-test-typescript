import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualRetentionScoreView, toManualRetentionScoreViews } from "./manual-retention-score-view.js";
import { newManualRetentionScore } from "./manual-retention-score.js";

test("ManualRetentionScoreView shows the status in capitals", () => {
  const item = newManualRetentionScore("code-819", "name-173");
  const view = toManualRetentionScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualRetentionScoreViews([item, item]).length, 2, "views");
});
