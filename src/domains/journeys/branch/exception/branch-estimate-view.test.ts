import assert from "node:assert/strict";
import { test } from "node:test";
import { toBranchEstimateView, toBranchEstimateViews } from "./branch-estimate-view.js";
import { newBranchEstimate } from "./branch-estimate.js";

test("BranchEstimateView shows the status in capitals", () => {
  const item = newBranchEstimate("code-999", "title-208");
  const view = toBranchEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBranchEstimateViews([item, item]).length, 2, "views");
});
