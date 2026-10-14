import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultReputationBatchEngine } from "./reputation-batch-engine.js";
import { newReputationBatch } from "./reputation-batch.js";

test("ReputationBatchEngine keeps results within bounds", () => {
  const engine = defaultReputationBatchEngine();
  const item = newReputationBatch("code-327", "name-55");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
