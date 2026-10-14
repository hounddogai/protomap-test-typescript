import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedConversionReservationEngine } from "./batched-conversion-reservation-engine.js";
import { newBatchedConversionReservation } from "./batched-conversion-reservation.js";

test("BatchedConversionReservationEngine keeps results within bounds", () => {
  const engine = defaultBatchedConversionReservationEngine();
  const item = newBatchedConversionReservation("code-74", "title-765");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
