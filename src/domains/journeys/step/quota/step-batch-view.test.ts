import assert from "node:assert/strict";
import { test } from "node:test";
import { toStepBatchView, toStepBatchViews } from "./step-batch-view.js";
import { newStepBatch } from "./step-batch.js";

test("StepBatchView shows the status in capitals", () => {
  const item = newStepBatch("code-418", "name-634");
  const view = toStepBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStepBatchViews([item, item]).length, 2, "views");
});
