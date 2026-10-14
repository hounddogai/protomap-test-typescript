import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultInviteReservationEngine } from "./invite-reservation-engine.js";
import { newInviteReservation } from "./invite-reservation.js";

test("InviteReservationEngine keeps results within bounds", () => {
  const engine = defaultInviteReservationEngine();
  const item = newInviteReservation("code-230", "title-52");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
