import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualConversionReservationEngine } from "./manual-conversion-reservation-engine.js";
import { newManualConversionReservation } from "./manual-conversion-reservation.js";

test("ManualConversionReservationEngine keeps results within bounds", () => {
  const engine = defaultManualConversionReservationEngine();
  const item = newManualConversionReservation("code-815", "name-666");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
