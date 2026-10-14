import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredPlacementReservationEngine } from "./tiered-placement-reservation-engine.js";
import { newTieredPlacementReservation } from "./tiered-placement-reservation.js";

test("TieredPlacementReservationEngine keeps results within bounds", () => {
  const engine = defaultTieredPlacementReservationEngine();
  const item = newTieredPlacementReservation("code-491", "title-352");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
