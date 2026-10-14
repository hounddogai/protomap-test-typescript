import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredEscalationReservationEngine } from "./tiered-escalation-reservation-engine.js";
import { newTieredEscalationReservation } from "./tiered-escalation-reservation.js";

test("TieredEscalationReservationEngine keeps results within bounds", () => {
  const engine = defaultTieredEscalationReservationEngine(flags.newRegistry());
  const item = newTieredEscalationReservation("code-177", "label-841");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
