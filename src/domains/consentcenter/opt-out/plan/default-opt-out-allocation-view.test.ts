import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultOptOutAllocationView, toDefaultOptOutAllocationViews } from "./default-opt-out-allocation-view.js";
import { newDefaultOptOutAllocation } from "./default-opt-out-allocation.js";

test("DefaultOptOutAllocationView shows the status in capitals", () => {
  const item = newDefaultOptOutAllocation("code-803", "label-663");
  const view = toDefaultOptOutAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultOptOutAllocationViews([item, item]).length, 2, "views");
});
