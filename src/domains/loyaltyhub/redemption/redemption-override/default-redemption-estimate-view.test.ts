import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toDefaultRedemptionEstimateView,
  toDefaultRedemptionEstimateViews,
} from "./default-redemption-estimate-view.js";
import { newDefaultRedemptionEstimate } from "./default-redemption-estimate.js";

test("DefaultRedemptionEstimateView shows the status in capitals", () => {
  const item = newDefaultRedemptionEstimate("code-748", "title-401");
  const view = toDefaultRedemptionEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultRedemptionEstimateViews([item, item]).length, 2, "views");
});
