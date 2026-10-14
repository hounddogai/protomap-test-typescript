import assert from "node:assert/strict";
import { test } from "node:test";
import { toBranchVarianceView, toBranchVarianceViews } from "./branch-variance-view.js";
import { newBranchVariance } from "./branch-variance.js";

test("BranchVarianceView shows the status in capitals", () => {
  const item = newBranchVariance("code-861", "label-477");
  const view = toBranchVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBranchVarianceViews([item, item]).length, 2, "views");
});
