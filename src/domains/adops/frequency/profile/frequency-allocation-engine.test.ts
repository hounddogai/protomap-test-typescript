import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFrequencyAllocationEngine } from "./frequency-allocation-engine.js";
import { newFrequencyAllocation } from "./frequency-allocation.js";

test("FrequencyAllocationEngine keeps results within bounds", () => {
  const engine = defaultFrequencyAllocationEngine(flags.newRegistry());
  const item = newFrequencyAllocation("code-705", "label-931");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
