import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toGlobalSubscriptionEstimateView,
  toGlobalSubscriptionEstimateViews,
} from "./global-subscription-estimate-view.js";
import { newGlobalSubscriptionEstimate } from "./global-subscription-estimate.js";

test("GlobalSubscriptionEstimateView shows the status in capitals", () => {
  const item = newGlobalSubscriptionEstimate("code-486", "name-63");
  const view = toGlobalSubscriptionEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalSubscriptionEstimateViews([item, item]).length, 2, "views");
});
