import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedCohortAllocationView, toBatchedCohortAllocationViews } from "./batched-cohort-allocation-view.js";
import { newBatchedCohortAllocation } from "./batched-cohort-allocation.js";

test("BatchedCohortAllocationView shows the status in capitals", () => {
  const item = newBatchedCohortAllocation("code-197", "name-240");
  const view = toBatchedCohortAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedCohortAllocationViews([item, item]).length, 2, "views");
});
