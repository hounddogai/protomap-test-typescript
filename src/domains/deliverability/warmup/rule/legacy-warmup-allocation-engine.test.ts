import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyWarmupAllocationEngine } from "./legacy-warmup-allocation-engine.js";
import { newLegacyWarmupAllocation } from "./legacy-warmup-allocation.js";

test("LegacyWarmupAllocationEngine keeps results within bounds", () => {
  const engine = defaultLegacyWarmupAllocationEngine();
  const item = newLegacyWarmupAllocation("code-791", "name-120");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
