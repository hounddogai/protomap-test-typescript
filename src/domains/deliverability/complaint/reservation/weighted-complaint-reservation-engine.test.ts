import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedComplaintReservationEngine } from "./weighted-complaint-reservation-engine.js";
import { newWeightedComplaintReservation } from "./weighted-complaint-reservation.js";

test("WeightedComplaintReservationEngine keeps results within bounds", () => {
  const engine = defaultWeightedComplaintReservationEngine(flags.newRegistry());
  const item = newWeightedComplaintReservation("code-303", "name-771");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
