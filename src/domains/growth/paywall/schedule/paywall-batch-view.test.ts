import assert from "node:assert/strict";
import { test } from "node:test";
import { toPaywallBatchView, toPaywallBatchViews } from "./paywall-batch-view.js";
import { newPaywallBatch } from "./paywall-batch.js";

test("PaywallBatchView shows the status in capitals", () => {
  const item = newPaywallBatch("code-364", "title-38");
  const view = toPaywallBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPaywallBatchViews([item, item]).length, 2, "views");
});
