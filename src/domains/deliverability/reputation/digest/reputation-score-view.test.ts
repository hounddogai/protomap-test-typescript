import assert from "node:assert/strict";
import { test } from "node:test";
import { toReputationScoreView, toReputationScoreViews } from "./reputation-score-view.js";
import { newReputationScore } from "./reputation-score.js";

test("ReputationScoreView shows the status in capitals", () => {
  const item = newReputationScore("code-336", "label-13");
  const view = toReputationScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReputationScoreViews([item, item]).length, 2, "views");
});
