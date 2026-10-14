import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalBranchMilestoneView, toGlobalBranchMilestoneViews } from "./global-branch-milestone-view.js";
import { newGlobalBranchMilestone } from "./global-branch-milestone.js";

test("GlobalBranchMilestoneView shows the status in capitals", () => {
  const item = newGlobalBranchMilestone("code-597", "label-815");
  const view = toGlobalBranchMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalBranchMilestoneViews([item, item]).length, 2, "views");
});
