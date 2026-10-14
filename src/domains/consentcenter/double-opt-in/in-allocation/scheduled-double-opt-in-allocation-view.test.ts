import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledDoubleOptInAllocationView,
  toScheduledDoubleOptInAllocationViews,
} from "./scheduled-double-opt-in-allocation-view.js";
import { newScheduledDoubleOptInAllocation } from "./scheduled-double-opt-in-allocation.js";

test("ScheduledDoubleOptInAllocationView shows the status in capitals", () => {
  const item = newScheduledDoubleOptInAllocation("code-80", "label-111");
  const view = toScheduledDoubleOptInAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledDoubleOptInAllocationViews([item, item]).length, 2, "views");
});
