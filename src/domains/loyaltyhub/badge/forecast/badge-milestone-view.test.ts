import assert from "node:assert/strict";
import { test } from "node:test";
import { toBadgeMilestoneView, toBadgeMilestoneViews } from "./badge-milestone-view.js";
import { newBadgeMilestone } from "./badge-milestone.js";

test("BadgeMilestoneView shows the status in capitals", () => {
  const item = newBadgeMilestone("code-274", "name-231");
  const view = toBadgeMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBadgeMilestoneViews([item, item]).length, 2, "views");
});
