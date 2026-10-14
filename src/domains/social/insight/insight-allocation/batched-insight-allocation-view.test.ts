import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toBatchedInsightAllocationView,
  toBatchedInsightAllocationViews,
} from "./batched-insight-allocation-view.js";
import { newBatchedInsightAllocation } from "./batched-insight-allocation.js";

test("BatchedInsightAllocationView shows the status in capitals", () => {
  const item = newBatchedInsightAllocation("code-427", "label-372");
  const view = toBatchedInsightAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedInsightAllocationViews([item, item]).length, 2, "views");
});
