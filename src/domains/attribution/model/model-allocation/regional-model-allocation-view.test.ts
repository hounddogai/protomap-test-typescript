import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalModelAllocationView, toRegionalModelAllocationViews } from "./regional-model-allocation-view.js";
import { newRegionalModelAllocation } from "./regional-model-allocation.js";

test("RegionalModelAllocationView shows the status in capitals", () => {
  const item = newRegionalModelAllocation("code-81", "label-395");
  const view = toRegionalModelAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalModelAllocationViews([item, item]).length, 2, "views");
});
