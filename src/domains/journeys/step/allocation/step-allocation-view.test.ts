import assert from "node:assert/strict";
import { test } from "node:test";
import { toStepAllocationView, toStepAllocationViews } from "./step-allocation-view.js";
import { newStepAllocation } from "./step-allocation.js";

test("StepAllocationView shows the status in capitals", () => {
  const item = newStepAllocation("code-727", "label-318");
  const view = toStepAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStepAllocationViews([item, item]).length, 2, "views");
});
