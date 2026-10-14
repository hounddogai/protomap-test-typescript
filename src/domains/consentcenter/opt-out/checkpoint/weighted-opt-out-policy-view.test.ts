import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedOptOutPolicyView, toWeightedOptOutPolicyViews } from "./weighted-opt-out-policy-view.js";
import { newWeightedOptOutPolicy } from "./weighted-opt-out-policy.js";

test("WeightedOptOutPolicyView shows the status in capitals", () => {
  const item = newWeightedOptOutPolicy("code-162", "label-320");
  const view = toWeightedOptOutPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedOptOutPolicyViews([item, item]).length, 2, "views");
});
