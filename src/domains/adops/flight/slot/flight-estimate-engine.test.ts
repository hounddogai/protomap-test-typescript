import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFlightEstimateEngine } from "./flight-estimate-engine.js";
import { newFlightEstimate } from "./flight-estimate.js";

test("FlightEstimateEngine keeps results within bounds", () => {
  const engine = defaultFlightEstimateEngine(flags.newRegistry());
  const item = newFlightEstimate("code-831", "name-323");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
