import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedPayoutBatchView, toBatchedPayoutBatchViews } from "./batched-payout-batch-view.js";
import { newBatchedPayoutBatch } from "./batched-payout-batch.js";

test("BatchedPayoutBatchView shows the status in capitals", () => {
  const item = newBatchedPayoutBatch("code-856", "name-933");
  const view = toBatchedPayoutBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedPayoutBatchViews([item, item]).length, 2, "views");
});
