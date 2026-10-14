import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalRewardThresholdView, toSeasonalRewardThresholdViews } from "./seasonal-reward-threshold-view.js";
import { newSeasonalRewardThreshold } from "./seasonal-reward-threshold.js";

test("SeasonalRewardThresholdView shows the status in capitals", () => {
  const item = newSeasonalRewardThreshold("code-702", "name-484");
  const view = toSeasonalRewardThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalRewardThresholdViews([item, item]).length, 2, "views");
});
