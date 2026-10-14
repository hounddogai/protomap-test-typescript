import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalCreditReservationEngine } from "./seasonal-credit-reservation-engine.js";
import { newSeasonalCreditReservation } from "./seasonal-credit-reservation.js";

test("SeasonalCreditReservationEngine keeps results within bounds", () => {
  const engine = defaultSeasonalCreditReservationEngine();
  const item = newSeasonalCreditReservation("code-874", "label-759");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
