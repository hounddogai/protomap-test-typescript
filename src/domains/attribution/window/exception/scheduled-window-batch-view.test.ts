import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledWindowBatchView, toScheduledWindowBatchViews } from "./scheduled-window-batch-view.js";
import { newScheduledWindowBatch } from "./scheduled-window-batch.js";

test("ScheduledWindowBatchView shows the status in capitals", () => {
  const item = newScheduledWindowBatch("code-601", "label-462");
  const view = toScheduledWindowBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledWindowBatchViews([item, item]).length, 2, "views");
});
