import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackPostReservationEngine } from "./fallback-post-reservation-engine.js";
import { newFallbackPostReservation } from "./fallback-post-reservation.js";

test("FallbackPostReservationEngine keeps results within bounds", () => {
  const engine = defaultFallbackPostReservationEngine();
  const item = newFallbackPostReservation("code-50", "label-984");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
