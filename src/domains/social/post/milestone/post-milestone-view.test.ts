import assert from "node:assert/strict";
import { test } from "node:test";
import { toPostMilestoneView, toPostMilestoneViews } from "./post-milestone-view.js";
import { newPostMilestone } from "./post-milestone.js";

test("PostMilestoneView shows the status in capitals", () => {
  const item = newPostMilestone("code-150", "name-921");
  const view = toPostMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPostMilestoneViews([item, item]).length, 2, "views");
});
