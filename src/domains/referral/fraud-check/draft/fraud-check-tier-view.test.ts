import assert from "node:assert/strict";
import { test } from "node:test";
import { toFraudCheckTierView, toFraudCheckTierViews } from "./fraud-check-tier-view.js";
import { newFraudCheckTier } from "./fraud-check-tier.js";

test("FraudCheckTierView shows the status in capitals", () => {
  const item = newFraudCheckTier("code-710", "label-425");
  const view = toFraudCheckTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFraudCheckTierViews([item, item]).length, 2, "views");
});
