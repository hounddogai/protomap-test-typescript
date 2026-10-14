import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSlaReservationEngine } from "./sla-reservation-engine.js";
import { newSlaReservation } from "./sla-reservation.js";

test("SlaReservationEngine keeps results within bounds", () => {
  const engine = defaultSlaReservationEngine();
  const item = newSlaReservation("code-403", "name-950");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
