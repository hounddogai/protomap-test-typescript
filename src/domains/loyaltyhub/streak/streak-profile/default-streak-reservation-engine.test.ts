import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultStreakReservationEngine } from "./default-streak-reservation-engine.js";
import { newDefaultStreakReservation } from "./default-streak-reservation.js";

test("DefaultStreakReservationEngine keeps results within bounds", () => {
  const engine = defaultDefaultStreakReservationEngine();
  const item = newDefaultStreakReservation("code-534", "name-832");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
