import assert from "node:assert/strict";
import { test } from "node:test";
import { toPayoutCycleView, toPayoutCycleViews } from "./payout-cycle-view.js";
import { newPayoutCycle } from "./payout-cycle.js";

test("PayoutCycleView shows the status in capitals", () => {
  const item = newPayoutCycle("code-195", "title-636");
  const view = toPayoutCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPayoutCycleViews([item, item]).length, 2, "views");
});
