import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryBranchRollupView, toPrimaryBranchRollupViews } from "./primary-branch-rollup-view.js";
import { newPrimaryBranchRollup } from "./primary-branch-rollup.js";

test("PrimaryBranchRollupView shows the status in capitals", () => {
  const item = newPrimaryBranchRollup("code-313", "name-891");
  const view = toPrimaryBranchRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryBranchRollupViews([item, item]).length, 2, "views");
});
