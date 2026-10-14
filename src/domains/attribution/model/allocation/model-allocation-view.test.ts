import assert from "node:assert/strict";
import { test } from "node:test";
import { toModelAllocationView, toModelAllocationViews } from "./model-allocation-view.js";
import { newModelAllocation } from "./model-allocation.js";

test("ModelAllocationView shows the status in capitals", () => {
  const item = newModelAllocation("code-95", "label-12");
  const view = toModelAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toModelAllocationViews([item, item]).length, 2, "views");
});
