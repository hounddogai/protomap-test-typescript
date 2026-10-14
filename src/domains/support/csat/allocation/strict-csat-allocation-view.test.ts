import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictCsatAllocationView, toStrictCsatAllocationViews } from "./strict-csat-allocation-view.js";
import { newStrictCsatAllocation } from "./strict-csat-allocation.js";

test("StrictCsatAllocationView shows the status in capitals", () => {
  const item = newStrictCsatAllocation("code-685", "label-106");
  const view = toStrictCsatAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictCsatAllocationViews([item, item]).length, 2, "views");
});
