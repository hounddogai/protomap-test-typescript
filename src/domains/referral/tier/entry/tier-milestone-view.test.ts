import assert from "node:assert/strict";
import { test } from "node:test";
import { toTierMilestoneView, toTierMilestoneViews } from "./tier-milestone-view.js";
import { newTierMilestone } from "./tier-milestone.js";

test("TierMilestoneView shows the status in capitals", () => {
  const item = newTierMilestone("code-223", "title-528");
  const view = toTierMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTierMilestoneViews([item, item]).length, 2, "views");
});
