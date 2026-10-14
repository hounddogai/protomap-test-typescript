import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalFlightEstimateView, toGlobalFlightEstimateViews } from "./global-flight-estimate-view.js";
import { newGlobalFlightEstimate } from "./global-flight-estimate.js";

test("GlobalFlightEstimateView shows the status in capitals", () => {
  const item = newGlobalFlightEstimate("code-703", "title-733");
  const view = toGlobalFlightEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalFlightEstimateViews([item, item]).length, 2, "views");
});
