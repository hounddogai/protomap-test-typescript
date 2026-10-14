import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toStrictPreferenceMilestoneView,
  toStrictPreferenceMilestoneViews,
} from "./strict-preference-milestone-view.js";
import { newStrictPreferenceMilestone } from "./strict-preference-milestone.js";

test("StrictPreferenceMilestoneView shows the status in capitals", () => {
  const item = newStrictPreferenceMilestone("code-568", "name-413");
  const view = toStrictPreferenceMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictPreferenceMilestoneViews([item, item]).length, 2, "views");
});
