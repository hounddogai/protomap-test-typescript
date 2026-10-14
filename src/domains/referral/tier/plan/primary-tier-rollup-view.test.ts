import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryTierRollupView, toPrimaryTierRollupViews } from "./primary-tier-rollup-view.js";
import { newPrimaryTierRollup } from "./primary-tier-rollup.js";

test("PrimaryTierRollupView shows the status in capitals", () => {
  const item = newPrimaryTierRollup("code-571", "label-527");
  const view = toPrimaryTierRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryTierRollupViews([item, item]).length, 2, "views");
});
