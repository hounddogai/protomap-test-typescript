import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedFraudCheckReservationEngine } from "./batched-fraud-check-reservation-engine.js";
import { newBatchedFraudCheckReservation } from "./batched-fraud-check-reservation.js";

test("BatchedFraudCheckReservationEngine keeps results within bounds", () => {
  const engine = defaultBatchedFraudCheckReservationEngine(flags.newRegistry());
  const item = newBatchedFraudCheckReservation("code-395", "title-679");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
