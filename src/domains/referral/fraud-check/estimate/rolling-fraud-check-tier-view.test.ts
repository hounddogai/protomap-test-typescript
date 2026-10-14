import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingFraudCheckTierView, toRollingFraudCheckTierViews } from "./rolling-fraud-check-tier-view.js";
import { newRollingFraudCheckTier } from "./rolling-fraud-check-tier.js";

test("RollingFraudCheckTierView shows the status in capitals", () => {
  const item = newRollingFraudCheckTier("code-290", "name-161");
  const view = toRollingFraudCheckTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingFraudCheckTierViews([item, item]).length, 2, "views");
});
