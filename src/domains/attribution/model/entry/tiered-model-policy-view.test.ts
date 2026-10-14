import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredModelPolicyView, toTieredModelPolicyViews } from "./tiered-model-policy-view.js";
import { newTieredModelPolicy } from "./tiered-model-policy.js";

test("TieredModelPolicyView shows the status in capitals", () => {
  const item = newTieredModelPolicy("code-949", "name-595");
  const view = toTieredModelPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredModelPolicyViews([item, item]).length, 2, "views");
});
