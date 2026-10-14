import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toGlobalRedemptionEstimateView,
  toGlobalRedemptionEstimateViews,
} from "./global-redemption-estimate-view.js";
import { newGlobalRedemptionEstimate } from "./global-redemption-estimate.js";

test("GlobalRedemptionEstimateView shows the status in capitals", () => {
  const item = newGlobalRedemptionEstimate("code-926", "name-123");
  const view = toGlobalRedemptionEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalRedemptionEstimateViews([item, item]).length, 2, "views");
});
