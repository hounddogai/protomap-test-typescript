import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toDefaultPreferenceMilestoneView,
  toDefaultPreferenceMilestoneViews,
} from "./default-preference-milestone-view.js";
import { newDefaultPreferenceMilestone } from "./default-preference-milestone.js";

test("DefaultPreferenceMilestoneView shows the status in capitals", () => {
  const item = newDefaultPreferenceMilestone("code-119", "title-342");
  const view = toDefaultPreferenceMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultPreferenceMilestoneViews([item, item]).length, 2, "views");
});
