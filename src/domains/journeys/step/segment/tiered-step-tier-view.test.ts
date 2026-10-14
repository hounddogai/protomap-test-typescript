import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredStepTierView, toTieredStepTierViews } from "./tiered-step-tier-view.js";
import { newTieredStepTier } from "./tiered-step-tier.js";

test("TieredStepTierView shows the status in capitals", () => {
  const item = newTieredStepTier("code-724", "name-891");
  const view = toTieredStepTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredStepTierViews([item, item]).length, 2, "views");
});
