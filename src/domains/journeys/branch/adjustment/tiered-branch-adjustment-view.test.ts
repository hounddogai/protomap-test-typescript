import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredBranchAdjustmentView, toTieredBranchAdjustmentViews } from "./tiered-branch-adjustment-view.js";
import { newTieredBranchAdjustment } from "./tiered-branch-adjustment.js";

test("TieredBranchAdjustmentView shows the status in capitals", () => {
  const item = newTieredBranchAdjustment("code-478", "label-795");
  const view = toTieredBranchAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredBranchAdjustmentViews([item, item]).length, 2, "views");
});
