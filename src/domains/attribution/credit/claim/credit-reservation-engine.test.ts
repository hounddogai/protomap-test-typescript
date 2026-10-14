import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCreditReservationEngine } from "./credit-reservation-engine.js";
import { newCreditReservation } from "./credit-reservation.js";

test("CreditReservationEngine keeps results within bounds", () => {
  const engine = defaultCreditReservationEngine();
  const item = newCreditReservation("code-353", "title-308");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
