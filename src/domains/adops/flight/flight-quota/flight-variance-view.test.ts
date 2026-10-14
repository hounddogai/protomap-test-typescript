import assert from "node:assert/strict";
import { test } from "node:test";
import { toFlightVarianceView, toFlightVarianceViews } from "./flight-variance-view.js";
import { newFlightVariance } from "./flight-variance.js";

test("FlightVarianceView shows the status in capitals", () => {
  const item = newFlightVariance("code-924", "label-505");
  const view = toFlightVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFlightVarianceViews([item, item]).length, 2, "views");
});
