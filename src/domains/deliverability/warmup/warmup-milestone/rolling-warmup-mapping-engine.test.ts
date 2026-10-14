import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingWarmupMappingEngine } from "./rolling-warmup-mapping-engine.js";
import { newRollingWarmupMapping } from "./rolling-warmup-mapping.js";

test("RollingWarmupMappingEngine keeps results within bounds", () => {
  const engine = defaultRollingWarmupMappingEngine();
  const item = newRollingWarmupMapping("code-794", "label-700");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
