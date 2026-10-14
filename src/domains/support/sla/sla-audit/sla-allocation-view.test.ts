import assert from "node:assert/strict";
import { test } from "node:test";
import { toSlaAllocationView, toSlaAllocationViews } from "./sla-allocation-view.js";
import { newSlaAllocation } from "./sla-allocation.js";

test("SlaAllocationView shows the status in capitals", () => {
  const item = newSlaAllocation("code-715", "name-507");
  const view = toSlaAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSlaAllocationViews([item, item]).length, 2, "views");
});
