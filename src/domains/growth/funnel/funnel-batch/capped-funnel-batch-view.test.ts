import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedFunnelBatchView, toCappedFunnelBatchViews } from "./capped-funnel-batch-view.js";
import { newCappedFunnelBatch } from "./capped-funnel-batch.js";

test("CappedFunnelBatchView shows the status in capitals", () => {
  const item = newCappedFunnelBatch("code-32", "name-489");
  const view = toCappedFunnelBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedFunnelBatchViews([item, item]).length, 2, "views");
});
