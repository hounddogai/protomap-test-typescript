import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedStepAdjustmentView, toBatchedStepAdjustmentViews } from "./batched-step-adjustment-view.js";
import { newBatchedStepAdjustment } from "./batched-step-adjustment.js";

test("BatchedStepAdjustmentView shows the status in capitals", () => {
  const item = newBatchedStepAdjustment("code-578", "name-491");
  const view = toBatchedStepAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedStepAdjustmentViews([item, item]).length, 2, "views");
});
