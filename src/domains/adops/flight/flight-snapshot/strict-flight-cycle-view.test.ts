import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictFlightCycleView, toStrictFlightCycleViews } from "./strict-flight-cycle-view.js";
import { newStrictFlightCycle } from "./strict-flight-cycle.js";

test("StrictFlightCycleView shows the status in capitals", () => {
  const item = newStrictFlightCycle("code-37", "label-749");
  const view = toStrictFlightCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictFlightCycleViews([item, item]).length, 2, "views");
});
