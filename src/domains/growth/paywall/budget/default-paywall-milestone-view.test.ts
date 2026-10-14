import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultPaywallMilestoneView, toDefaultPaywallMilestoneViews } from "./default-paywall-milestone-view.js";
import { newDefaultPaywallMilestone } from "./default-paywall-milestone.js";

test("DefaultPaywallMilestoneView shows the status in capitals", () => {
  const item = newDefaultPaywallMilestone("code-634", "name-239");
  const view = toDefaultPaywallMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultPaywallMilestoneViews([item, item]).length, 2, "views");
});
