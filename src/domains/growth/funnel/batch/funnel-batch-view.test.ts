import assert from "node:assert/strict";
import { test } from "node:test";
import { toFunnelBatchView, toFunnelBatchViews } from "./funnel-batch-view.js";
import { newFunnelBatch } from "./funnel-batch.js";

test("FunnelBatchView shows the status in capitals", () => {
  const item = newFunnelBatch("code-517", "name-241");
  const view = toFunnelBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFunnelBatchViews([item, item]).length, 2, "views");
});
