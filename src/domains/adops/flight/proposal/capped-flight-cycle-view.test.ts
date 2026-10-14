import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedFlightCycleView, toCappedFlightCycleViews } from "./capped-flight-cycle-view.js";
import { newCappedFlightCycle } from "./capped-flight-cycle.js";

test("CappedFlightCycleView shows the status in capitals", () => {
  const item = newCappedFlightCycle("code-382", "label-117");
  const view = toCappedFlightCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedFlightCycleViews([item, item]).length, 2, "views");
});
