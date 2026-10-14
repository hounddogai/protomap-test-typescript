import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackOptOutBatchView, toFallbackOptOutBatchViews } from "./fallback-opt-out-batch-view.js";
import { newFallbackOptOutBatch } from "./fallback-opt-out-batch.js";

test("FallbackOptOutBatchView shows the status in capitals", () => {
  const item = newFallbackOptOutBatch("code-572", "name-937");
  const view = toFallbackOptOutBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackOptOutBatchViews([item, item]).length, 2, "views");
});
