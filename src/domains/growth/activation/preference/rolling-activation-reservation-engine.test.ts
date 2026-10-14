import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingActivationReservationEngine } from "./rolling-activation-reservation-engine.js";
import { newRollingActivationReservation } from "./rolling-activation-reservation.js";

test("RollingActivationReservationEngine keeps results within bounds", () => {
  const engine = defaultRollingActivationReservationEngine(flags.newRegistry());
  const item = newRollingActivationReservation("code-64", "label-773");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
