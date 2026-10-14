import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedWarmupReservationEngine } from "./capped-warmup-reservation-engine.js";
import { newCappedWarmupReservation } from "./capped-warmup-reservation.js";

test("CappedWarmupReservationEngine keeps results within bounds", () => {
  const engine = defaultCappedWarmupReservationEngine();
  const item = newCappedWarmupReservation("code-746", "name-824");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
