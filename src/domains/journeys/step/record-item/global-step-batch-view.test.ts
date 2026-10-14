import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalStepBatchView, toGlobalStepBatchViews } from "./global-step-batch-view.js";
import { newGlobalStepBatch } from "./global-step-batch.js";

test("GlobalStepBatchView shows the status in capitals", () => {
  const item = newGlobalStepBatch("code-237", "label-897");
  const view = toGlobalStepBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalStepBatchViews([item, item]).length, 2, "views");
});
