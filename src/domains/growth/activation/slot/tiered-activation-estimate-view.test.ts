import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toTieredActivationEstimateView,
  toTieredActivationEstimateViews,
} from "./tiered-activation-estimate-view.js";
import { newTieredActivationEstimate } from "./tiered-activation-estimate.js";

test("TieredActivationEstimateView shows the status in capitals", () => {
  const item = newTieredActivationEstimate("code-912", "name-439");
  const view = toTieredActivationEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredActivationEstimateViews([item, item]).length, 2, "views");
});
