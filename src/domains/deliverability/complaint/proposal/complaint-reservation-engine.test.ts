import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultComplaintReservationEngine } from "./complaint-reservation-engine.js";
import { newComplaintReservation } from "./complaint-reservation.js";

test("ComplaintReservationEngine keeps results within bounds", () => {
  const engine = defaultComplaintReservationEngine(flags.newRegistry());
  const item = newComplaintReservation("code-679", "label-872");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
