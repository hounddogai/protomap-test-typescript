import assert from "node:assert/strict";
import { test } from "node:test";
import { toTierAllocationView, toTierAllocationViews } from "./tier-allocation-view.js";
import { newTierAllocation } from "./tier-allocation.js";

test("TierAllocationView shows the status in capitals", () => {
  const item = newTierAllocation("code-488", "name-422");
  const view = toTierAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTierAllocationViews([item, item]).length, 2, "views");
});
