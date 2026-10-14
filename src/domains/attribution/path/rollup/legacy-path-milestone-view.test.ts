import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyPathMilestoneView, toLegacyPathMilestoneViews } from "./legacy-path-milestone-view.js";
import { newLegacyPathMilestone } from "./legacy-path-milestone.js";

test("LegacyPathMilestoneView shows the status in capitals", () => {
  const item = newLegacyPathMilestone("code-49", "name-367");
  const view = toLegacyPathMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyPathMilestoneViews([item, item]).length, 2, "views");
});
