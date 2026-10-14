import assert from "node:assert/strict";
import { test } from "node:test";
import { toRedemptionAllocationView, toRedemptionAllocationViews } from "./redemption-allocation-view.js";
import { newRedemptionAllocation } from "./redemption-allocation.js";

test("RedemptionAllocationView shows the status in capitals", () => {
  const item = newRedemptionAllocation("code-126", "title-763");
  const view = toRedemptionAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRedemptionAllocationViews([item, item]).length, 2, "views");
});
