import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalWarmupAllocationEngine } from "./seasonal-warmup-allocation-engine.js";
import { newSeasonalWarmupAllocation } from "./seasonal-warmup-allocation.js";

test("SeasonalWarmupAllocationEngine keeps results within bounds", () => {
  const engine = defaultSeasonalWarmupAllocationEngine();
  const item = newSeasonalWarmupAllocation("code-707", "name-212");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
