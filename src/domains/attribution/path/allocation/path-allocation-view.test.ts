import assert from "node:assert/strict";
import { test } from "node:test";
import { toPathAllocationView, toPathAllocationViews } from "./path-allocation-view.js";
import { newPathAllocation } from "./path-allocation.js";

test("PathAllocationView shows the status in capitals", () => {
  const item = newPathAllocation("code-493", "label-368");
  const view = toPathAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPathAllocationViews([item, item]).length, 2, "views");
});
