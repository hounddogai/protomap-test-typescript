import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveTierAllocationView, toAdaptiveTierAllocationViews } from "./adaptive-tier-allocation-view.js";
import { newAdaptiveTierAllocation } from "./adaptive-tier-allocation.js";

test("AdaptiveTierAllocationView shows the status in capitals", () => {
  const item = newAdaptiveTierAllocation("code-19", "name-266");
  const view = toAdaptiveTierAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveTierAllocationViews([item, item]).length, 2, "views");
});
