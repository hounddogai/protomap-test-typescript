import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalSubscriptionReservationEngine } from "./regional-subscription-reservation-engine.js";
import { newRegionalSubscriptionReservation } from "./regional-subscription-reservation.js";

test("RegionalSubscriptionReservationEngine keeps results within bounds", () => {
  const engine = defaultRegionalSubscriptionReservationEngine();
  const item = newRegionalSubscriptionReservation("code-113", "title-29");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
