import assert from "node:assert/strict";
import { test } from "node:test";
import { toDeflectionBatchView, toDeflectionBatchViews } from "./deflection-batch-view.js";
import { newDeflectionBatch } from "./deflection-batch.js";

test("DeflectionBatchView shows the status in capitals", () => {
  const item = newDeflectionBatch("code-109", "name-304");
  const view = toDeflectionBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDeflectionBatchViews([item, item]).length, 2, "views");
});
