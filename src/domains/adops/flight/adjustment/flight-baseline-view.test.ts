import assert from "node:assert/strict";
import { test } from "node:test";
import { toFlightBaselineView, toFlightBaselineViews } from "./flight-baseline-view.js";
import { newFlightBaseline } from "./flight-baseline.js";

test("FlightBaselineView shows the status in capitals", () => {
  const item = newFlightBaseline("code-810", "name-866");
  const view = toFlightBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFlightBaselineViews([item, item]).length, 2, "views");
});
