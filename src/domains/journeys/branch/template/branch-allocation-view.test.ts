import assert from "node:assert/strict";
import { test } from "node:test";
import { toBranchAllocationView, toBranchAllocationViews } from "./branch-allocation-view.js";
import { newBranchAllocation } from "./branch-allocation.js";

test("BranchAllocationView shows the status in capitals", () => {
  const item = newBranchAllocation("code-770", "name-39");
  const view = toBranchAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBranchAllocationViews([item, item]).length, 2, "views");
});
