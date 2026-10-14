import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFrequencyBatchEngine } from "./frequency-batch-engine.js";
import { newFrequencyBatch } from "./frequency-batch.js";

test("FrequencyBatchEngine keeps results within bounds", () => {
  const engine = defaultFrequencyBatchEngine();
  const item = newFrequencyBatch("code-385", "label-91");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
