import assert from "node:assert/strict";
import { test } from "node:test";
import { toPayoutVarianceView, toPayoutVarianceViews } from "./payout-variance-view.js";
import { newPayoutVariance } from "./payout-variance.js";

test("PayoutVarianceView shows the status in capitals", () => {
  const item = newPayoutVariance("code-803", "title-950");
  const view = toPayoutVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPayoutVarianceViews([item, item]).length, 2, "views");
});
