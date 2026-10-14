import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDeflectionReservationEngine } from "./deflection-reservation-engine.js";
import { newDeflectionReservation } from "./deflection-reservation.js";

test("DeflectionReservationEngine keeps results within bounds", () => {
  const engine = defaultDeflectionReservationEngine();
  const item = newDeflectionReservation("code-671", "label-397");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
