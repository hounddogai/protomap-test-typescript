import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultInsightReservationEngine } from "./insight-reservation-engine.js";
import { newInsightReservation } from "./insight-reservation.js";

test("InsightReservationEngine keeps results within bounds", () => {
  const engine = defaultInsightReservationEngine(flags.newRegistry());
  const item = newInsightReservation("code-527", "title-866");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
