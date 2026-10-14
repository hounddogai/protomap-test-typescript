import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFunnelReservationEngine } from "./funnel-reservation-engine.js";
import { newFunnelReservation } from "./funnel-reservation.js";

test("FunnelReservationEngine keeps results within bounds", () => {
  const engine = defaultFunnelReservationEngine();
  const item = newFunnelReservation("code-923", "name-494");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
