import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBadgeReservationEngine } from "./badge-reservation-engine.js";
import { newBadgeReservation } from "./badge-reservation.js";

test("BadgeReservationEngine keeps results within bounds", () => {
  const engine = defaultBadgeReservationEngine(flags.newRegistry());
  const item = newBadgeReservation("code-265", "label-133");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
