import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toCappedSubscriptionAllocationView,
  toCappedSubscriptionAllocationViews,
} from "./capped-subscription-allocation-view.js";
import { newCappedSubscriptionAllocation } from "./capped-subscription-allocation.js";

test("CappedSubscriptionAllocationView shows the status in capitals", () => {
  const item = newCappedSubscriptionAllocation("code-568", "name-182");
  const view = toCappedSubscriptionAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedSubscriptionAllocationViews([item, item]).length, 2, "views");
});
