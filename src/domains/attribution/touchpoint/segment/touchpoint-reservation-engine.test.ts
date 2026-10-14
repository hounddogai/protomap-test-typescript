import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTouchpointReservationEngine } from "./touchpoint-reservation-engine.js";
import { newTouchpointReservation } from "./touchpoint-reservation.js";

test("TouchpointReservationEngine keeps results within bounds", () => {
  const engine = defaultTouchpointReservationEngine();
  const item = newTouchpointReservation("code-391", "name-852");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
