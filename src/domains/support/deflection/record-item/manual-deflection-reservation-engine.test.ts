import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualDeflectionReservationEngine } from "./manual-deflection-reservation-engine.js";
import { newManualDeflectionReservation } from "./manual-deflection-reservation.js";

test("ManualDeflectionReservationEngine keeps results within bounds", () => {
  const engine = defaultManualDeflectionReservationEngine(flags.newRegistry());
  const item = newManualDeflectionReservation("code-799", "title-340");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
