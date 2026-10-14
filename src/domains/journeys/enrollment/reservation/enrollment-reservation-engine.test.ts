import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultEnrollmentReservationEngine } from "./enrollment-reservation-engine.js";
import { newEnrollmentReservation } from "./enrollment-reservation.js";

test("EnrollmentReservationEngine keeps results within bounds", () => {
  const engine = defaultEnrollmentReservationEngine();
  const item = newEnrollmentReservation("code-340", "title-401");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
