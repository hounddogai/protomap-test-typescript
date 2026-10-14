import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalBidRuleMilestoneView,
  toSeasonalBidRuleMilestoneViews,
} from "./seasonal-bid-rule-milestone-view.js";
import { newSeasonalBidRuleMilestone } from "./seasonal-bid-rule-milestone.js";

test("SeasonalBidRuleMilestoneView shows the status in capitals", () => {
  const item = newSeasonalBidRuleMilestone("code-410", "title-416");
  const view = toSeasonalBidRuleMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalBidRuleMilestoneViews([item, item]).length, 2, "views");
});
