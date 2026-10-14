import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredLevelReservationEngine } from "./tiered-level-reservation-engine.js";
import { newTieredLevelReservation } from "./tiered-level-reservation.js";

test("TieredLevelReservationEngine keeps results within bounds", () => {
  const engine = defaultTieredLevelReservationEngine(flags.newRegistry());
  const item = newTieredLevelReservation("code-46", "title-257");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
