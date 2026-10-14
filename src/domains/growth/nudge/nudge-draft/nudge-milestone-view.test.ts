import assert from "node:assert/strict";
import { test } from "node:test";
import { toNudgeMilestoneView, toNudgeMilestoneViews } from "./nudge-milestone-view.js";
import { newNudgeMilestone } from "./nudge-milestone.js";

test("NudgeMilestoneView shows the status in capitals", () => {
  const item = newNudgeMilestone("code-627", "label-603");
  const view = toNudgeMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toNudgeMilestoneViews([item, item]).length, 2, "views");
});
