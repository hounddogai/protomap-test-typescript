import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRollingRedemptionVarianceView,
  toRollingRedemptionVarianceViews,
} from "./rolling-redemption-variance-view.js";
import { newRollingRedemptionVariance } from "./rolling-redemption-variance.js";

test("RollingRedemptionVarianceView shows the status in capitals", () => {
  const item = newRollingRedemptionVariance("code-889", "name-554");
  const view = toRollingRedemptionVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingRedemptionVarianceViews([item, item]).length, 2, "views");
});
