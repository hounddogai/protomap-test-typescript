import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingTierRollupView, toRollingTierRollupViews } from "./rolling-tier-rollup-view.js";
import { newRollingTierRollup } from "./rolling-tier-rollup.js";

test("RollingTierRollupView shows the status in capitals", () => {
  const item = newRollingTierRollup("code-447", "label-389");
  const view = toRollingTierRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingTierRollupViews([item, item]).length, 2, "views");
});
