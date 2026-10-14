import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryInsightReservationEngine } from "./primary-insight-reservation-engine.js";
import { newPrimaryInsightReservation } from "./primary-insight-reservation.js";

test("PrimaryInsightReservationEngine keeps results within bounds", () => {
  const engine = defaultPrimaryInsightReservationEngine(flags.newRegistry());
  const item = newPrimaryInsightReservation("code-87", "name-108");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
