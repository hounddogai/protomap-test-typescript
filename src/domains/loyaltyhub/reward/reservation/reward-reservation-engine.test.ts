import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRewardReservationEngine } from "./reward-reservation-engine.js";
import { newRewardReservation } from "./reward-reservation.js";

test("RewardReservationEngine keeps results within bounds", () => {
  const engine = defaultRewardReservationEngine();
  const item = newRewardReservation("code-483", "name-962");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
