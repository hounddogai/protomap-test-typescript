import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedPathMilestoneView, toCappedPathMilestoneViews } from "./capped-path-milestone-view.js";
import { newCappedPathMilestone } from "./capped-path-milestone.js";

test("CappedPathMilestoneView shows the status in capitals", () => {
  const item = newCappedPathMilestone("code-119", "label-770");
  const view = toCappedPathMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedPathMilestoneViews([item, item]).length, 2, "views");
});
