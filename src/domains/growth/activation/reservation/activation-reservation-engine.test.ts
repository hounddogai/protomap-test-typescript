import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultActivationReservationEngine } from "./activation-reservation-engine.js";
import { newActivationReservation } from "./activation-reservation.js";

test("ActivationReservationEngine keeps results within bounds", () => {
  const engine = defaultActivationReservationEngine();
  const item = newActivationReservation("code-797", "label-798");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
