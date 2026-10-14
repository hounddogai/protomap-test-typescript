import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyWaitReservationEngine } from "./legacy-wait-reservation-engine.js";
import { newLegacyWaitReservation } from "./legacy-wait-reservation.js";

test("LegacyWaitReservationEngine keeps results within bounds", () => {
  const engine = defaultLegacyWaitReservationEngine(flags.newRegistry());
  const item = newLegacyWaitReservation("code-994", "title-402");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
