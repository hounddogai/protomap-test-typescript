import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingConversionReservationEngine } from "./pending-conversion-reservation-engine.js";
import { newPendingConversionReservation } from "./pending-conversion-reservation.js";

test("PendingConversionReservationEngine keeps results within bounds", () => {
  const engine = defaultPendingConversionReservationEngine(flags.newRegistry());
  const item = newPendingConversionReservation("code-952", "label-725");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
