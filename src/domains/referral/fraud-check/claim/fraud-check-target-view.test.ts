import assert from "node:assert/strict";
import { test } from "node:test";
import { toFraudCheckTargetView, toFraudCheckTargetViews } from "./fraud-check-target-view.js";
import { newFraudCheckTarget } from "./fraud-check-target.js";

test("FraudCheckTargetView shows the status in capitals", () => {
  const item = newFraudCheckTarget("code-2", "name-459");
  const view = toFraudCheckTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFraudCheckTargetViews([item, item]).length, 2, "views");
});
