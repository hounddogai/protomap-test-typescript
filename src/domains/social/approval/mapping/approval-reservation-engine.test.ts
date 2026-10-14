import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultApprovalReservationEngine } from "./approval-reservation-engine.js";
import { newApprovalReservation } from "./approval-reservation.js";

test("ApprovalReservationEngine keeps results within bounds", () => {
  const engine = defaultApprovalReservationEngine();
  const item = newApprovalReservation("code-509", "title-530");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
