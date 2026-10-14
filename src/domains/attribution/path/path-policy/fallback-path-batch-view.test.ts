import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackPathBatchView, toFallbackPathBatchViews } from "./fallback-path-batch-view.js";
import { newFallbackPathBatch } from "./fallback-path-batch.js";

test("FallbackPathBatchView shows the status in capitals", () => {
  const item = newFallbackPathBatch("code-241", "label-168");
  const view = toFallbackPathBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackPathBatchViews([item, item]).length, 2, "views");
});
