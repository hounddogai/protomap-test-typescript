import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWindowReservationEngine } from "./window-reservation-engine.js";
import { newWindowReservation } from "./window-reservation.js";

test("WindowReservationEngine keeps results within bounds", () => {
  const engine = defaultWindowReservationEngine();
  const item = newWindowReservation("code-452", "label-514");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
