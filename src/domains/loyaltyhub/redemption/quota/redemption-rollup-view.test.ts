import assert from "node:assert/strict";
import { test } from "node:test";
import { toRedemptionRollupView, toRedemptionRollupViews } from "./redemption-rollup-view.js";
import { newRedemptionRollup } from "./redemption-rollup.js";

test("RedemptionRollupView shows the status in capitals", () => {
  const item = newRedemptionRollup("code-542", "label-743");
  const view = toRedemptionRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRedemptionRollupViews([item, item]).length, 2, "views");
});
