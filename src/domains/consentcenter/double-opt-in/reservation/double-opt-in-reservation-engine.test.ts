import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDoubleOptInReservationEngine } from "./double-opt-in-reservation-engine.js";
import { newDoubleOptInReservation } from "./double-opt-in-reservation.js";

test("DoubleOptInReservationEngine keeps results within bounds", () => {
  const engine = defaultDoubleOptInReservationEngine();
  const item = newDoubleOptInReservation("code-607", "name-403");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
