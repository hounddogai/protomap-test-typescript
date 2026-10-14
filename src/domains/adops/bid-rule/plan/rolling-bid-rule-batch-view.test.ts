import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingBidRuleBatchView, toRollingBidRuleBatchViews } from "./rolling-bid-rule-batch-view.js";
import { newRollingBidRuleBatch } from "./rolling-bid-rule-batch.js";

test("RollingBidRuleBatchView shows the status in capitals", () => {
  const item = newRollingBidRuleBatch("code-125", "title-174");
  const view = toRollingBidRuleBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingBidRuleBatchViews([item, item]).length, 2, "views");
});
