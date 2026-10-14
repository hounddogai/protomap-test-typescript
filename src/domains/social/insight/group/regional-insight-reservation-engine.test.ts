import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalInsightReservationEngine } from "./regional-insight-reservation-engine.js";
import { newRegionalInsightReservation } from "./regional-insight-reservation.js";

test("RegionalInsightReservationEngine keeps results within bounds", () => {
  const engine = defaultRegionalInsightReservationEngine(flags.newRegistry());
  const item = newRegionalInsightReservation("code-382", "name-103");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
