import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedPacingMappingEngine } from "./batched-pacing-mapping-engine.js";
import { newBatchedPacingMapping } from "./batched-pacing-mapping.js";

test("BatchedPacingMappingEngine keeps results within bounds", () => {
  const engine = defaultBatchedPacingMappingEngine();
  const item = newBatchedPacingMapping("code-109", "title-837");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
