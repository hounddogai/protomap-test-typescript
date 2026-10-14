import assert from "node:assert/strict";
import { test } from "node:test";
import { toFraudCheckVarianceView, toFraudCheckVarianceViews } from "./fraud-check-variance-view.js";
import { newFraudCheckVariance } from "./fraud-check-variance.js";

test("FraudCheckVarianceView shows the status in capitals", () => {
  const item = newFraudCheckVariance("code-367", "label-174");
  const view = toFraudCheckVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFraudCheckVarianceViews([item, item]).length, 2, "views");
});
