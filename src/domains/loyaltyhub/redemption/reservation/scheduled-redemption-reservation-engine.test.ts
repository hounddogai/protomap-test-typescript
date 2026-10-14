import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledRedemptionReservationEngine } from "./scheduled-redemption-reservation-engine.js";
import { newScheduledRedemptionReservation } from "./scheduled-redemption-reservation.js";

test("ScheduledRedemptionReservationEngine keeps results within bounds", () => {
  const engine = defaultScheduledRedemptionReservationEngine(flags.newRegistry());
  const item = newScheduledRedemptionReservation("code-840", "name-306");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
