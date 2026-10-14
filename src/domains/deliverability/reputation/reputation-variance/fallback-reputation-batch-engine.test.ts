import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackReputationBatchEngine } from "./fallback-reputation-batch-engine.js";
import { newFallbackReputationBatch } from "./fallback-reputation-batch.js";

test("FallbackReputationBatchEngine keeps results within bounds", () => {
  const engine = defaultFallbackReputationBatchEngine(flags.newRegistry());
  const item = newFallbackReputationBatch("code-381", "title-366");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
