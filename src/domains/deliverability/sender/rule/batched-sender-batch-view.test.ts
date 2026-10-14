import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedSenderBatchView, toBatchedSenderBatchViews } from "./batched-sender-batch-view.js";
import { newBatchedSenderBatch } from "./batched-sender-batch.js";

test("BatchedSenderBatchView shows the status in capitals", () => {
  const item = newBatchedSenderBatch("code-323", "label-988");
  const view = toBatchedSenderBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedSenderBatchViews([item, item]).length, 2, "views");
});
