import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingWarmupReservationEngine } from "./pending-warmup-reservation-engine.js";
import { newPendingWarmupReservation } from "./pending-warmup-reservation.js";

test("PendingWarmupReservationEngine keeps results within bounds", () => {
  const engine = defaultPendingWarmupReservationEngine();
  const item = newPendingWarmupReservation("code-506", "title-366");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
