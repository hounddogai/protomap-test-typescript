import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveFraudCheckScoreView, toAdaptiveFraudCheckScoreViews } from "./adaptive-fraud-check-score-view.js";
import { newAdaptiveFraudCheckScore } from "./adaptive-fraud-check-score.js";

test("AdaptiveFraudCheckScoreView shows the status in capitals", () => {
  const item = newAdaptiveFraudCheckScore("code-63", "label-302");
  const view = toAdaptiveFraudCheckScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveFraudCheckScoreViews([item, item]).length, 2, "views");
});
