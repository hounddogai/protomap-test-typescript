import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyFlightReservationEngine } from "./legacy-flight-reservation-engine.js";
import { newLegacyFlightReservation } from "./legacy-flight-reservation.js";

test("LegacyFlightReservationEngine keeps results within bounds", () => {
  const engine = defaultLegacyFlightReservationEngine(flags.newRegistry());
  const item = newLegacyFlightReservation("code-643", "label-102");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
