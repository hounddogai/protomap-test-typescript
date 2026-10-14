import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedPathAllocationView, toCappedPathAllocationViews } from "./capped-path-allocation-view.js";
import { newCappedPathAllocation } from "./capped-path-allocation.js";

test("CappedPathAllocationView shows the status in capitals", () => {
  const item = newCappedPathAllocation("code-789", "name-715");
  const view = toCappedPathAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedPathAllocationViews([item, item]).length, 2, "views");
});
