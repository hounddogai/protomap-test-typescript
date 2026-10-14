import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedActivationAllocationView,
  toWeightedActivationAllocationViews,
} from "./weighted-activation-allocation-view.js";
import { newWeightedActivationAllocation } from "./weighted-activation-allocation.js";

test("WeightedActivationAllocationView shows the status in capitals", () => {
  const item = newWeightedActivationAllocation("code-845", "name-164");
  const view = toWeightedActivationAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedActivationAllocationViews([item, item]).length, 2, "views");
});
