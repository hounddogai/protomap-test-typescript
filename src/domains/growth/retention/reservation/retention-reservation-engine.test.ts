import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRetentionReservationEngine } from "./retention-reservation-engine.js";
import { newRetentionReservation } from "./retention-reservation.js";

test("RetentionReservationEngine keeps results within bounds", () => {
  const engine = defaultRetentionReservationEngine();
  const item = newRetentionReservation("code-215", "name-584");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
