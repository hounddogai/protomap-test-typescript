import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreativeMilestoneView, toCreativeMilestoneViews } from "./creative-milestone-view.js";
import { newCreativeMilestone } from "./creative-milestone.js";

test("CreativeMilestoneView shows the status in capitals", () => {
  const item = newCreativeMilestone("code-696", "name-621");
  const view = toCreativeMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreativeMilestoneViews([item, item]).length, 2, "views");
});
