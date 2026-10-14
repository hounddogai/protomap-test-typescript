import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultEscalationReservationEngine } from "./escalation-reservation-engine.js";
import { newEscalationReservation } from "./escalation-reservation.js";

test("EscalationReservationEngine keeps results within bounds", () => {
  const engine = defaultEscalationReservationEngine(flags.newRegistry());
  const item = newEscalationReservation("code-592", "title-970");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
