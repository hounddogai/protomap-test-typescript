import assert from "node:assert/strict";
import { test } from "node:test";
import { toWindowAllocationView, toWindowAllocationViews } from "./window-allocation-view.js";
import { newWindowAllocation } from "./window-allocation.js";

test("WindowAllocationView shows the status in capitals", () => {
  const item = newWindowAllocation("code-751", "name-994");
  const view = toWindowAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWindowAllocationViews([item, item]).length, 2, "views");
});
