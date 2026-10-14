import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictBranchMilestoneView, toStrictBranchMilestoneViews } from "./strict-branch-milestone-view.js";
import { newStrictBranchMilestone } from "./strict-branch-milestone.js";

test("StrictBranchMilestoneView shows the status in capitals", () => {
  const item = newStrictBranchMilestone("code-614", "name-315");
  const view = toStrictBranchMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictBranchMilestoneViews([item, item]).length, 2, "views");
});
