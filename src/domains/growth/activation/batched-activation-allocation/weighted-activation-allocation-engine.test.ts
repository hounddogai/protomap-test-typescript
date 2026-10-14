import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedActivationAllocationEngine } from "./weighted-activation-allocation-engine.js";
import { newWeightedActivationAllocation } from "./weighted-activation-allocation.js";

test("WeightedActivationAllocationEngine keeps results within bounds", () => {
  const engine = defaultWeightedActivationAllocationEngine();
  const item = newWeightedActivationAllocation("code-845", "name-164");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
