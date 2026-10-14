import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalCreditAllocationView, toGlobalCreditAllocationViews } from "./global-credit-allocation-view.js";
import { newGlobalCreditAllocation } from "./global-credit-allocation.js";

test("GlobalCreditAllocationView shows the status in capitals", () => {
  const item = newGlobalCreditAllocation("code-658", "label-795");
  const view = toGlobalCreditAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalCreditAllocationViews([item, item]).length, 2, "views");
});
