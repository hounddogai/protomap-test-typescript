import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRegionalSubscriptionAllocationView,
  toRegionalSubscriptionAllocationViews,
} from "./regional-subscription-allocation-view.js";
import { newRegionalSubscriptionAllocation } from "./regional-subscription-allocation.js";

test("RegionalSubscriptionAllocationView shows the status in capitals", () => {
  const item = newRegionalSubscriptionAllocation("code-533", "label-821");
  const view = toRegionalSubscriptionAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalSubscriptionAllocationViews([item, item]).length, 2, "views");
});
