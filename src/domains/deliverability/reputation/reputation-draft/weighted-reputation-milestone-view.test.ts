import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedReputationMilestoneView,
  toWeightedReputationMilestoneViews,
} from "./weighted-reputation-milestone-view.js";
import { newWeightedReputationMilestone } from "./weighted-reputation-milestone.js";

test("WeightedReputationMilestoneView shows the status in capitals", () => {
  const item = newWeightedReputationMilestone("code-35", "name-79");
  const view = toWeightedReputationMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedReputationMilestoneViews([item, item]).length, 2, "views");
});
