import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualPayoutBatchView, toManualPayoutBatchViews } from "./manual-payout-batch-view.js";
import { newManualPayoutBatch } from "./manual-payout-batch.js";

test("ManualPayoutBatchView shows the status in capitals", () => {
  const item = newManualPayoutBatch("code-658", "title-76");
  const view = toManualPayoutBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualPayoutBatchViews([item, item]).length, 2, "views");
});
