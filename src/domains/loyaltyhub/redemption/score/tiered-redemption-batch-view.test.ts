import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredRedemptionBatchView, toTieredRedemptionBatchViews } from "./tiered-redemption-batch-view.js";
import { newTieredRedemptionBatch } from "./tiered-redemption-batch.js";

test("TieredRedemptionBatchView shows the status in capitals", () => {
  const item = newTieredRedemptionBatch("code-27", "label-630");
  const view = toTieredRedemptionBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredRedemptionBatchViews([item, item]).length, 2, "views");
});
