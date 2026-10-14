import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledConversionReservationEngine } from "./scheduled-conversion-reservation-engine.js";
import { newScheduledConversionReservation } from "./scheduled-conversion-reservation.js";

test("ScheduledConversionReservationEngine keeps results within bounds", () => {
  const engine = defaultScheduledConversionReservationEngine(flags.newRegistry());
  const item = newScheduledConversionReservation("code-326", "label-21");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
