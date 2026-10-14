import assert from "node:assert/strict";
import { test } from "node:test";
import { toWaitBatchView, toWaitBatchViews } from "./wait-batch-view.js";
import { newWaitBatch } from "./wait-batch.js";

test("WaitBatchView shows the status in capitals", () => {
  const item = newWaitBatch("code-611", "title-819");
  const view = toWaitBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWaitBatchViews([item, item]).length, 2, "views");
});
