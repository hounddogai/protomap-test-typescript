import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toCappedTouchpointMilestoneView,
  toCappedTouchpointMilestoneViews,
} from "./capped-touchpoint-milestone-view.js";
import { newCappedTouchpointMilestone } from "./capped-touchpoint-milestone.js";

test("CappedTouchpointMilestoneView shows the status in capitals", () => {
  const item = newCappedTouchpointMilestone("code-483", "name-958");
  const view = toCappedTouchpointMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedTouchpointMilestoneViews([item, item]).length, 2, "views");
});
