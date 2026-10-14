import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalFrequencyAllocationEngine } from "./regional-frequency-allocation-engine.js";
import { newRegionalFrequencyAllocation } from "./regional-frequency-allocation.js";

test("RegionalFrequencyAllocationEngine keeps results within bounds", () => {
  const engine = defaultRegionalFrequencyAllocationEngine(flags.newRegistry());
  const item = newRegionalFrequencyAllocation("code-575", "title-597");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
