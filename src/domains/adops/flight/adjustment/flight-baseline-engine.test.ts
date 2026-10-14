import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFlightBaselineEngine } from "./flight-baseline-engine.js";
import { newFlightBaseline } from "./flight-baseline.js";

test("FlightBaselineEngine keeps results within bounds", () => {
  const engine = defaultFlightBaselineEngine(flags.newRegistry());
  const item = newFlightBaseline("code-810", "name-866");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
