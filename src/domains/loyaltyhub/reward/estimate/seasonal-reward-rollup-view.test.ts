import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalRewardRollupView, toSeasonalRewardRollupViews } from "./seasonal-reward-rollup-view.js";
import { newSeasonalRewardRollup } from "./seasonal-reward-rollup.js";

test("SeasonalRewardRollupView shows the status in capitals", () => {
  const item = newSeasonalRewardRollup("code-775", "label-669");
  const view = toSeasonalRewardRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalRewardRollupViews([item, item]).length, 2, "views");
});
