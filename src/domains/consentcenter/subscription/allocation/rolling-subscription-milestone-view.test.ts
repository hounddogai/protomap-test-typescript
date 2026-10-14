import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRollingSubscriptionMilestoneView,
  toRollingSubscriptionMilestoneViews,
} from "./rolling-subscription-milestone-view.js";
import { newRollingSubscriptionMilestone } from "./rolling-subscription-milestone.js";

test("RollingSubscriptionMilestoneView shows the status in capitals", () => {
  const item = newRollingSubscriptionMilestone("code-438", "title-649");
  const view = toRollingSubscriptionMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingSubscriptionMilestoneViews([item, item]).length, 2, "views");
});
