import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFlightVarianceEngine } from "./flight-variance-engine.js";
import { newFlightVariance } from "./flight-variance.js";

test("FlightVarianceEngine keeps results within bounds", () => {
  const engine = defaultFlightVarianceEngine(flags.newRegistry());
  const item = newFlightVariance("code-924", "label-505");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
