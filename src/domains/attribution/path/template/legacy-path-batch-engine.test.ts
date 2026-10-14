import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyPathBatchEngine } from "./legacy-path-batch-engine.js";
import { newLegacyPathBatch } from "./legacy-path-batch.js";

test("LegacyPathBatchEngine keeps results within bounds", () => {
  const engine = defaultLegacyPathBatchEngine();
  const item = newLegacyPathBatch("code-20", "name-264");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
