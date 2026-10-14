import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultRedemptionReservationEngine } from "./default-redemption-reservation-engine.js";
import { newDefaultRedemptionReservation } from "./default-redemption-reservation.js";

test("DefaultRedemptionReservationEngine keeps results within bounds", () => {
  const engine = defaultDefaultRedemptionReservationEngine();
  const item = newDefaultRedemptionReservation("code-576", "label-322");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
