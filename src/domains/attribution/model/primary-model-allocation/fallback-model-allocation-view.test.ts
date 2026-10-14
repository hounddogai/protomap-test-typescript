import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackModelAllocationView, toFallbackModelAllocationViews } from "./fallback-model-allocation-view.js";
import { newFallbackModelAllocation } from "./fallback-model-allocation.js";

test("FallbackModelAllocationView shows the status in capitals", () => {
  const item = newFallbackModelAllocation("code-558", "label-973");
  const view = toFallbackModelAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackModelAllocationViews([item, item]).length, 2, "views");
});
