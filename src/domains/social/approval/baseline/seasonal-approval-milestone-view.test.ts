import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalApprovalMilestoneView,
  toSeasonalApprovalMilestoneViews,
} from "./seasonal-approval-milestone-view.js";
import { newSeasonalApprovalMilestone } from "./seasonal-approval-milestone.js";

test("SeasonalApprovalMilestoneView shows the status in capitals", () => {
  const item = newSeasonalApprovalMilestone("code-158", "title-200");
  const view = toSeasonalApprovalMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalApprovalMilestoneViews([item, item]).length, 2, "views");
});
