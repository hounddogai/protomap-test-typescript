import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledBounceMilestoneView,
  toScheduledBounceMilestoneViews,
} from "./scheduled-bounce-milestone-view.js";
import { newScheduledBounceMilestone } from "./scheduled-bounce-milestone.js";

test("ScheduledBounceMilestoneView shows the status in capitals", () => {
  const item = newScheduledBounceMilestone("code-467", "label-970");
  const view = toScheduledBounceMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledBounceMilestoneViews([item, item]).length, 2, "views");
});
