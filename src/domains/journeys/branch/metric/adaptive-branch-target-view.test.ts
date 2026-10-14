import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveBranchTargetView, toAdaptiveBranchTargetViews } from "./adaptive-branch-target-view.js";
import { newAdaptiveBranchTarget } from "./adaptive-branch-target.js";

test("AdaptiveBranchTargetView shows the status in capitals", () => {
  const item = newAdaptiveBranchTarget("code-845", "name-937");
  const view = toAdaptiveBranchTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveBranchTargetViews([item, item]).length, 2, "views");
});
