import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackSenderReservationEngine } from "./fallback-sender-reservation-engine.js";
import { newFallbackSenderReservation } from "./fallback-sender-reservation.js";

test("FallbackSenderReservationEngine keeps results within bounds", () => {
  const engine = defaultFallbackSenderReservationEngine();
  const item = newFallbackSenderReservation("code-583", "title-531");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
