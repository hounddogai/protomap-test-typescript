import assert from "node:assert/strict";
import { test } from "node:test";
import { toTouchpointBatchView, toTouchpointBatchViews } from "./touchpoint-batch-view.js";
import { newTouchpointBatch } from "./touchpoint-batch.js";

test("TouchpointBatchView shows the status in capitals", () => {
  const item = newTouchpointBatch("code-105", "title-69");
  const view = toTouchpointBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTouchpointBatchViews([item, item]).length, 2, "views");
});
