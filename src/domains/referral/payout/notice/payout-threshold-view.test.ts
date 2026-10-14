import assert from "node:assert/strict";
import { test } from "node:test";
import { toPayoutThresholdView, toPayoutThresholdViews } from "./payout-threshold-view.js";
import { newPayoutThreshold } from "./payout-threshold.js";

test("PayoutThresholdView shows the status in capitals", () => {
  const item = newPayoutThreshold("code-262", "title-309");
  const view = toPayoutThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPayoutThresholdViews([item, item]).length, 2, "views");
});
