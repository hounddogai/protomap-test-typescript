import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimarySlaReservationEngine } from "./primary-sla-reservation-engine.js";
import { newPrimarySlaReservation } from "./primary-sla-reservation.js";

test("PrimarySlaReservationEngine keeps results within bounds", () => {
  const engine = defaultPrimarySlaReservationEngine(flags.newRegistry());
  const item = newPrimarySlaReservation("code-549", "name-380");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
