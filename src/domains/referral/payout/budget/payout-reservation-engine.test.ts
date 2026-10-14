import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPayoutReservationEngine } from "./payout-reservation-engine.js";
import { newPayoutReservation } from "./payout-reservation.js";

test("PayoutReservationEngine keeps results within bounds", () => {
  const engine = defaultPayoutReservationEngine(flags.newRegistry());
  const item = newPayoutReservation("code-238", "title-237");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
