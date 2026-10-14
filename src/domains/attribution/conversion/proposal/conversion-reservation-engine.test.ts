import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultConversionReservationEngine } from "./conversion-reservation-engine.js";
import { newConversionReservation } from "./conversion-reservation.js";

test("ConversionReservationEngine keeps results within bounds", () => {
  const engine = defaultConversionReservationEngine(flags.newRegistry());
  const item = newConversionReservation("code-344", "name-620");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
