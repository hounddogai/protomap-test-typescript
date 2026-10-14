import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingFrequencyAllocationEngine } from "./rolling-frequency-allocation-engine.js";
import { newRollingFrequencyAllocation } from "./rolling-frequency-allocation.js";

test("RollingFrequencyAllocationEngine keeps results within bounds", () => {
  const engine = defaultRollingFrequencyAllocationEngine(flags.newRegistry());
  const item = newRollingFrequencyAllocation("code-318", "name-936");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
