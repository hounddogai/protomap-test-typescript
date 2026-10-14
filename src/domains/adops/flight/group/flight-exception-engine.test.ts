import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFlightExceptionEngine } from "./flight-exception-engine.js";
import { newFlightException } from "./flight-exception.js";

test("FlightExceptionEngine keeps results within bounds", () => {
  const engine = defaultFlightExceptionEngine(flags.newRegistry());
  const item = newFlightException("code-988", "title-881");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
