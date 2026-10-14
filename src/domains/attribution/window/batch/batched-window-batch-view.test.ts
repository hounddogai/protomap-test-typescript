import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedWindowBatchView, toBatchedWindowBatchViews } from "./batched-window-batch-view.js";
import { newBatchedWindowBatch } from "./batched-window-batch.js";

test("BatchedWindowBatchView shows the status in capitals", () => {
  const item = newBatchedWindowBatch("code-481", "label-798");
  const view = toBatchedWindowBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedWindowBatchViews([item, item]).length, 2, "views");
});
