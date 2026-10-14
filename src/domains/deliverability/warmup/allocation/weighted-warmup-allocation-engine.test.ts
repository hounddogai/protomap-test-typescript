import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedWarmupAllocationEngine } from "./weighted-warmup-allocation-engine.js";
import { newWeightedWarmupAllocation } from "./weighted-warmup-allocation.js";

test("WeightedWarmupAllocationEngine keeps results within bounds", () => {
  const engine = defaultWeightedWarmupAllocationEngine();
  const item = newWeightedWarmupAllocation("code-44", "label-920");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
