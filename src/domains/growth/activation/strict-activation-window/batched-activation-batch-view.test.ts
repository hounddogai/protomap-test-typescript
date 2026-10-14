import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedActivationBatchView, toBatchedActivationBatchViews } from "./batched-activation-batch-view.js";
import { newBatchedActivationBatch } from "./batched-activation-batch.js";

test("BatchedActivationBatchView shows the status in capitals", () => {
  const item = newBatchedActivationBatch("code-919", "title-196");
  const view = toBatchedActivationBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedActivationBatchViews([item, item]).length, 2, "views");
});
