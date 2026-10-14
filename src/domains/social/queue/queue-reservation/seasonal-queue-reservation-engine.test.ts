import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalQueueReservationEngine } from "./seasonal-queue-reservation-engine.js";
import { newSeasonalQueueReservation } from "./seasonal-queue-reservation.js";

test("SeasonalQueueReservationEngine keeps results within bounds", () => {
  const engine = defaultSeasonalQueueReservationEngine();
  const item = newSeasonalQueueReservation("code-876", "label-537");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
