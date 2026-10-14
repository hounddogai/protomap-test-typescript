import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredBounceAllocationView, toTieredBounceAllocationViews } from "./tiered-bounce-allocation-view.js";
import { newTieredBounceAllocation } from "./tiered-bounce-allocation.js";

test("TieredBounceAllocationView shows the status in capitals", () => {
  const item = newTieredBounceAllocation("code-603", "name-26");
  const view = toTieredBounceAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredBounceAllocationViews([item, item]).length, 2, "views");
});
