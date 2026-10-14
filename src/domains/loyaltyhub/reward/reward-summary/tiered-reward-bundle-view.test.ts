import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredRewardBundleView, toTieredRewardBundleViews } from "./tiered-reward-bundle-view.js";
import { newTieredRewardBundle } from "./tiered-reward-bundle.js";

test("TieredRewardBundleView shows the status in capitals", () => {
  const item = newTieredRewardBundle("code-57", "name-596");
  const view = toTieredRewardBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredRewardBundleViews([item, item]).length, 2, "views");
});
