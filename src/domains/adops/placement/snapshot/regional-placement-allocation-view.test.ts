import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRegionalPlacementAllocationView,
  toRegionalPlacementAllocationViews,
} from "./regional-placement-allocation-view.js";
import { newRegionalPlacementAllocation } from "./regional-placement-allocation.js";

test("RegionalPlacementAllocationView shows the status in capitals", () => {
  const item = newRegionalPlacementAllocation("code-837", "title-520");
  const view = toRegionalPlacementAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalPlacementAllocationViews([item, item]).length, 2, "views");
});
