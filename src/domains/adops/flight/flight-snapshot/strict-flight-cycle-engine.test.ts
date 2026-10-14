import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictFlightCycleEngine } from "./strict-flight-cycle-engine.js";
import { newStrictFlightCycle } from "./strict-flight-cycle.js";

test("StrictFlightCycleEngine keeps results within bounds", () => {
  const engine = defaultStrictFlightCycleEngine(flags.newRegistry());
  const item = newStrictFlightCycle("code-37", "label-749");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
