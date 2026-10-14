import assert from "node:assert/strict";
import { test } from "node:test";
import { toBranchThresholdView, toBranchThresholdViews } from "./branch-threshold-view.js";
import { newBranchThreshold } from "./branch-threshold.js";

test("BranchThresholdView shows the status in capitals", () => {
  const item = newBranchThreshold("code-684", "title-536");
  const view = toBranchThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBranchThresholdViews([item, item]).length, 2, "views");
});
