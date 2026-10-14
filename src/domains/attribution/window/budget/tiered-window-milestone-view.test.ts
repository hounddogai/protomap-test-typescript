import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredWindowMilestoneView, toTieredWindowMilestoneViews } from "./tiered-window-milestone-view.js";
import { newTieredWindowMilestone } from "./tiered-window-milestone.js";

test("TieredWindowMilestoneView shows the status in capitals", () => {
  const item = newTieredWindowMilestone("code-356", "label-213");
  const view = toTieredWindowMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredWindowMilestoneViews([item, item]).length, 2, "views");
});
