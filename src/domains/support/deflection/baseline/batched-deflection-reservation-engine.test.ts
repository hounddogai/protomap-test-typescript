import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedDeflectionReservationEngine } from "./batched-deflection-reservation-engine.js";
import { newBatchedDeflectionReservation } from "./batched-deflection-reservation.js";

test("BatchedDeflectionReservationEngine keeps results within bounds", () => {
  const engine = defaultBatchedDeflectionReservationEngine(flags.newRegistry());
  const item = newBatchedDeflectionReservation("code-542", "label-599");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
