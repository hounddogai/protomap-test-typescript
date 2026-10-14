import assert from "node:assert/strict";
import { test } from "node:test";
import { toModelMilestoneView, toModelMilestoneViews } from "./model-milestone-view.js";
import { newModelMilestone } from "./model-milestone.js";

test("ModelMilestoneView shows the status in capitals", () => {
  const item = newModelMilestone("code-821", "name-625");
  const view = toModelMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toModelMilestoneViews([item, item]).length, 2, "views");
});
