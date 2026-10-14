import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredBounceReservationEngine } from "./tiered-bounce-reservation-engine.js";
import { newTieredBounceReservation } from "./tiered-bounce-reservation.js";

test("TieredBounceReservationEngine keeps results within bounds", () => {
  const engine = defaultTieredBounceReservationEngine(flags.newRegistry());
  const item = newTieredBounceReservation("code-137", "label-219");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
