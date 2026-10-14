import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredFraudCheckPolicyView, toTieredFraudCheckPolicyViews } from "./tiered-fraud-check-policy-view.js";
import { newTieredFraudCheckPolicy } from "./tiered-fraud-check-policy.js";

test("TieredFraudCheckPolicyView shows the status in capitals", () => {
  const item = newTieredFraudCheckPolicy("code-206", "name-263");
  const view = toTieredFraudCheckPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredFraudCheckPolicyViews([item, item]).length, 2, "views");
});
