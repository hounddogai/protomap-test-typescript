import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualPreferenceReservationEngine } from "./manual-preference-reservation-engine.js";
import { newManualPreferenceReservation } from "./manual-preference-reservation.js";

test("ManualPreferenceReservationEngine keeps results within bounds", () => {
  const engine = defaultManualPreferenceReservationEngine(flags.newRegistry());
  const item = newManualPreferenceReservation("code-885", "name-149");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
