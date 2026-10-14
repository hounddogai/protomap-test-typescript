import assert from "node:assert/strict";
import { test } from "node:test";
import { toExitRuleMilestoneView, toExitRuleMilestoneViews } from "./exit-rule-milestone-view.js";
import { newExitRuleMilestone } from "./exit-rule-milestone.js";

test("ExitRuleMilestoneView shows the status in capitals", () => {
  const item = newExitRuleMilestone("code-70", "label-249");
  const view = toExitRuleMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toExitRuleMilestoneViews([item, item]).length, 2, "views");
});
