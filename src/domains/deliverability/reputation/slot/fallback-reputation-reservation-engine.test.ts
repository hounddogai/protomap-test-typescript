import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackReputationReservationEngine } from "./fallback-reputation-reservation-engine.js";
import { newFallbackReputationReservation } from "./fallback-reputation-reservation.js";

test("FallbackReputationReservationEngine keeps results within bounds", () => {
  const engine = defaultFallbackReputationReservationEngine(flags.newRegistry());
  const item = newFallbackReputationReservation("code-709", "title-154");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
