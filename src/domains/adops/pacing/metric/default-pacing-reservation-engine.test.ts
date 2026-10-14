import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultPacingReservationEngine } from "./default-pacing-reservation-engine.js";
import { newDefaultPacingReservation } from "./default-pacing-reservation.js";

test("DefaultPacingReservationEngine keeps results within bounds", () => {
  const engine = defaultDefaultPacingReservationEngine(flags.newRegistry());
  const item = newDefaultPacingReservation("code-698", "label-87");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
