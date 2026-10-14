import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledOptOutAllocationView,
  toScheduledOptOutAllocationViews,
} from "./scheduled-opt-out-allocation-view.js";
import { newScheduledOptOutAllocation } from "./scheduled-opt-out-allocation.js";

test("ScheduledOptOutAllocationView shows the status in capitals", () => {
  const item = newScheduledOptOutAllocation("code-859", "title-873");
  const view = toScheduledOptOutAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledOptOutAllocationViews([item, item]).length, 2, "views");
});
