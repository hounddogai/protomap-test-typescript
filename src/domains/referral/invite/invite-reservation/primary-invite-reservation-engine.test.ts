import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryInviteReservationEngine } from "./primary-invite-reservation-engine.js";
import { newPrimaryInviteReservation } from "./primary-invite-reservation.js";

test("PrimaryInviteReservationEngine keeps results within bounds", () => {
  const engine = defaultPrimaryInviteReservationEngine();
  const item = newPrimaryInviteReservation("code-451", "name-783");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
