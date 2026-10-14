import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalRewardRollupView, toRegionalRewardRollupViews } from "./regional-reward-rollup-view.js";
import { newRegionalRewardRollup } from "./regional-reward-rollup.js";

test("RegionalRewardRollupView shows the status in capitals", () => {
  const item = newRegionalRewardRollup("code-922", "title-142");
  const view = toRegionalRewardRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalRewardRollupViews([item, item]).length, 2, "views");
});
