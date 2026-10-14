import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedWarmupMappingEngine } from "./batched-warmup-mapping-engine.js";
import { newBatchedWarmupMapping } from "./batched-warmup-mapping.js";

test("BatchedWarmupMappingEngine keeps results within bounds", () => {
  const engine = defaultBatchedWarmupMappingEngine(flags.newRegistry());
  const item = newBatchedWarmupMapping("code-752", "title-98");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
