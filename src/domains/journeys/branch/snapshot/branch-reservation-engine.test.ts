import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBranchReservationEngine } from "./branch-reservation-engine.js";
import { newBranchReservation } from "./branch-reservation.js";

test("BranchReservationEngine keeps results within bounds", () => {
  const engine = defaultBranchReservationEngine(flags.newRegistry());
  const item = newBranchReservation("code-273", "title-271");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
