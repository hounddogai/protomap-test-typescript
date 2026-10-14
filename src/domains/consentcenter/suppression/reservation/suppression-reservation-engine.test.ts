import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSuppressionReservationEngine } from "./suppression-reservation-engine.js";
import { newSuppressionReservation } from "./suppression-reservation.js";

test("SuppressionReservationEngine keeps results within bounds", () => {
  const engine = defaultSuppressionReservationEngine();
  const item = newSuppressionReservation("code-86", "label-211");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
