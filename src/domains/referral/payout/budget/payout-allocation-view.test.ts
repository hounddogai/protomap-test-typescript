import assert from "node:assert/strict";
import { test } from "node:test";
import { toPayoutAllocationView, toPayoutAllocationViews } from "./payout-allocation-view.js";
import { newPayoutAllocation } from "./payout-allocation.js";

test("PayoutAllocationView shows the status in capitals", () => {
  const item = newPayoutAllocation("code-821", "title-522");
  const view = toPayoutAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPayoutAllocationViews([item, item]).length, 2, "views");
});
