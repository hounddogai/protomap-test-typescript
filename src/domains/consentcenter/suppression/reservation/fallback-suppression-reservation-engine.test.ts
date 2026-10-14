import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackSuppressionReservationEngine } from "./fallback-suppression-reservation-engine.js";
import { newFallbackSuppressionReservation } from "./fallback-suppression-reservation.js";

test("FallbackSuppressionReservationEngine keeps results within bounds", () => {
  const engine = defaultFallbackSuppressionReservationEngine(flags.newRegistry());
  const item = newFallbackSuppressionReservation("code-239", "label-64");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
