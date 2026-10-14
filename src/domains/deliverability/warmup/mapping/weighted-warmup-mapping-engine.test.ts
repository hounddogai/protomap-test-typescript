import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedWarmupMappingEngine } from "./weighted-warmup-mapping-engine.js";
import { newWeightedWarmupMapping } from "./weighted-warmup-mapping.js";

test("WeightedWarmupMappingEngine keeps results within bounds", () => {
  const engine = defaultWeightedWarmupMappingEngine();
  const item = newWeightedWarmupMapping("code-894", "name-609");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
