import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedCreditThresholdView, toCappedCreditThresholdViews } from "./capped-credit-threshold-view.js";
import { newCappedCreditThreshold } from "./capped-credit-threshold.js";

test("CappedCreditThresholdView shows the status in capitals", () => {
  const item = newCappedCreditThreshold("code-858", "title-394");
  const view = toCappedCreditThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedCreditThresholdViews([item, item]).length, 2, "views");
});
