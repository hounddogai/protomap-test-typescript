import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedFrequencyReservationEngine } from "./capped-frequency-reservation-engine.js";
import { newCappedFrequencyReservation } from "./capped-frequency-reservation.js";

test("CappedFrequencyReservationEngine keeps results within bounds", () => {
  const engine = defaultCappedFrequencyReservationEngine();
  const item = newCappedFrequencyReservation("code-152", "title-446");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
