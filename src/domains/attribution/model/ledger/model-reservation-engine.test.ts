import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultModelReservationEngine } from "./model-reservation-engine.js";
import { newModelReservation } from "./model-reservation.js";

test("ModelReservationEngine keeps results within bounds", () => {
  const engine = defaultModelReservationEngine();
  const item = newModelReservation("code-223", "name-924");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
