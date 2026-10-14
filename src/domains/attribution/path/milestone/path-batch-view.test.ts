import assert from "node:assert/strict";
import { test } from "node:test";
import { toPathBatchView, toPathBatchViews } from "./path-batch-view.js";
import { newPathBatch } from "./path-batch.js";

test("PathBatchView shows the status in capitals", () => {
  const item = newPathBatch("code-990", "label-910");
  const view = toPathBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPathBatchViews([item, item]).length, 2, "views");
});
