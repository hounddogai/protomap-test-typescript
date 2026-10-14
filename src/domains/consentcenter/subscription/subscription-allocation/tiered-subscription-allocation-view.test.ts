import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toTieredSubscriptionAllocationView,
  toTieredSubscriptionAllocationViews,
} from "./tiered-subscription-allocation-view.js";
import { newTieredSubscriptionAllocation } from "./tiered-subscription-allocation.js";

test("TieredSubscriptionAllocationView shows the status in capitals", () => {
  const item = newTieredSubscriptionAllocation("code-133", "title-644");
  const view = toTieredSubscriptionAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredSubscriptionAllocationViews([item, item]).length, 2, "views");
});
