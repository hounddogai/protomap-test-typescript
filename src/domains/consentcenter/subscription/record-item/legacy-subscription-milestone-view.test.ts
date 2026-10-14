import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLegacySubscriptionMilestoneView,
  toLegacySubscriptionMilestoneViews,
} from "./legacy-subscription-milestone-view.js";
import { newLegacySubscriptionMilestone } from "./legacy-subscription-milestone.js";

test("LegacySubscriptionMilestoneView shows the status in capitals", () => {
  const item = newLegacySubscriptionMilestone("code-335", "title-843");
  const view = toLegacySubscriptionMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacySubscriptionMilestoneViews([item, item]).length, 2, "views");
});
