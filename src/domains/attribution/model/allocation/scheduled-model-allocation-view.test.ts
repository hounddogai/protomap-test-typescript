import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledModelAllocationView,
  toScheduledModelAllocationViews,
} from "./scheduled-model-allocation-view.js";
import { newScheduledModelAllocation } from "./scheduled-model-allocation.js";

test("ScheduledModelAllocationView shows the status in capitals", () => {
  const item = newScheduledModelAllocation("code-93", "name-525");
  const view = toScheduledModelAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledModelAllocationViews([item, item]).length, 2, "views");
});
