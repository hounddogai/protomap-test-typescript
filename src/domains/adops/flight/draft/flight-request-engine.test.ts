import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFlightRequestEngine } from "./flight-request-engine.js";
import { newFlightRequest } from "./flight-request.js";

test("FlightRequestEngine keeps results within bounds", () => {
  const engine = defaultFlightRequestEngine(flags.newRegistry());
  const item = newFlightRequest("code-651", "name-206");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
