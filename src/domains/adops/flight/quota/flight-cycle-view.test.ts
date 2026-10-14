import assert from "node:assert/strict";
import { test } from "node:test";
import { toFlightCycleView, toFlightCycleViews } from "./flight-cycle-view.js";
import { newFlightCycle } from "./flight-cycle.js";

test("FlightCycleView shows the status in capitals", () => {
  const item = newFlightCycle("code-532", "title-848");
  const view = toFlightCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFlightCycleViews([item, item]).length, 2, "views");
});
