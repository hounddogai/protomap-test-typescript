import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredBounceMilestoneView, toTieredBounceMilestoneViews } from "./tiered-bounce-milestone-view.js";
import { newTieredBounceMilestone } from "./tiered-bounce-milestone.js";

test("TieredBounceMilestoneView shows the status in capitals", () => {
  const item = newTieredBounceMilestone("code-893", "name-803");
  const view = toTieredBounceMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredBounceMilestoneViews([item, item]).length, 2, "views");
});
