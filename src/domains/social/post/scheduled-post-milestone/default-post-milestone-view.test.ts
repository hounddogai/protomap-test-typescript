import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultPostMilestoneView, toDefaultPostMilestoneViews } from "./default-post-milestone-view.js";
import { newDefaultPostMilestone } from "./default-post-milestone.js";

test("DefaultPostMilestoneView shows the status in capitals", () => {
  const item = newDefaultPostMilestone("code-600", "name-508");
  const view = toDefaultPostMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultPostMilestoneViews([item, item]).length, 2, "views");
});
