import assert from "node:assert/strict";
import { test } from "node:test";
import { toFraudCheckPolicyView, toFraudCheckPolicyViews } from "./fraud-check-policy-view.js";
import { newFraudCheckPolicy } from "./fraud-check-policy.js";

test("FraudCheckPolicyView shows the status in capitals", () => {
  const item = newFraudCheckPolicy("code-866", "title-268");
  const view = toFraudCheckPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFraudCheckPolicyViews([item, item]).length, 2, "views");
});
