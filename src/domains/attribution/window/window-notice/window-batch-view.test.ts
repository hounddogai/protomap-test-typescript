import assert from "node:assert/strict";
import { test } from "node:test";
import { toWindowBatchView, toWindowBatchViews } from "./window-batch-view.js";
import { newWindowBatch } from "./window-batch.js";

test("WindowBatchView shows the status in capitals", () => {
  const item = newWindowBatch("code-90", "label-334");
  const view = toWindowBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWindowBatchViews([item, item]).length, 2, "views");
});
