import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientFraudCheckScoreView, toLenientFraudCheckScoreViews } from "./lenient-fraud-check-score-view.js";
import { newLenientFraudCheckScore } from "./lenient-fraud-check-score.js";

test("LenientFraudCheckScoreView shows the status in capitals", () => {
  const item = newLenientFraudCheckScore("code-126", "label-799");
  const view = toLenientFraudCheckScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientFraudCheckScoreViews([item, item]).length, 2, "views");
});
