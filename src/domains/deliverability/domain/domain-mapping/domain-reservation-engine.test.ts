import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDomainReservationEngine } from "./domain-reservation-engine.js";
import { newDomainReservation } from "./domain-reservation.js";

test("DomainReservationEngine keeps results within bounds", () => {
  const engine = defaultDomainReservationEngine(flags.newRegistry());
  const item = newDomainReservation("code-787", "name-184");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
