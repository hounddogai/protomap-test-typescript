import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingPayoutBatchView, toRollingPayoutBatchViews } from "./rolling-payout-batch-view.js";
import { newRollingPayoutBatch } from "./rolling-payout-batch.js";

test("RollingPayoutBatchView shows the status in capitals", () => {
  const item = newRollingPayoutBatch("code-239", "name-896");
  const view = toRollingPayoutBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingPayoutBatchViews([item, item]).length, 2, "views");
});
