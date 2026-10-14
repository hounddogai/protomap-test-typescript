import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreditTierView, toCreditTierViews } from "./credit-tier-view.js";
import { newCreditTier } from "./credit-tier.js";

test("CreditTierView shows the status in capitals", () => {
  const item = newCreditTier("code-85", "label-354");
  const view = toCreditTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreditTierViews([item, item]).length, 2, "views");
});
