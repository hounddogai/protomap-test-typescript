import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryFraudCheckRollupView, toPrimaryFraudCheckRollupViews } from "./primary-fraud-check-rollup-view.js";
import { newPrimaryFraudCheckRollup } from "./primary-fraud-check-rollup.js";

test("PrimaryFraudCheckRollupView shows the status in capitals", () => {
  const item = newPrimaryFraudCheckRollup("code-681", "label-440");
  const view = toPrimaryFraudCheckRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryFraudCheckRollupViews([item, item]).length, 2, "views");
});
