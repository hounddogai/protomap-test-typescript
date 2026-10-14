import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedFlightVarianceView, toWeightedFlightVarianceViews } from "./weighted-flight-variance-view.js";
import { newWeightedFlightVariance } from "./weighted-flight-variance.js";

test("WeightedFlightVarianceView shows the status in capitals", () => {
  const item = newWeightedFlightVariance("code-711", "title-619");
  const view = toWeightedFlightVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedFlightVarianceViews([item, item]).length, 2, "views");
});
