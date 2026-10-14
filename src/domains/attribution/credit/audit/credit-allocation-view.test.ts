import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreditAllocationView, toCreditAllocationViews } from "./credit-allocation-view.js";
import { newCreditAllocation } from "./credit-allocation.js";

test("CreditAllocationView shows the status in capitals", () => {
  const item = newCreditAllocation("code-943", "name-690");
  const view = toCreditAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreditAllocationViews([item, item]).length, 2, "views");
});
